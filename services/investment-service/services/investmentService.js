// /services/investment-service/services/investmentService.js

const { sequelize } = require("../../../shared/config/db");
const User = require("../../user-service/models/user.model");
const accountService = require("../../account-service/services/accountService");
const auditService = require("../../audit-service/services/auditService");
const InvestmentProduct = require("../models/investmentProduct.model");
const Portfolio = require("../models/portfolio.model");
const Holding = require("../models/holding.model");
const InvestmentTransaction = require("../models/investmentTransaction.model");
const NavHistory = require("../models/navHistory.model");

const RISK_ORDER = {
  low: 1,
  medium: 2,
  high: 3,
};

function normalizeMoney(value) {
  return parseFloat(Number(value).toFixed(2));
}

function normalizeUnits(value) {
  return parseFloat(Number(value).toFixed(6));
}

function getUserRiskProfile(user) {
  if (user.risk_profile && RISK_ORDER[user.risk_profile]) {
    return user.risk_profile;
  }

  const income = parseFloat(user.annual_income || 0);
  if (income >= 1500000) return "high";
  if (income >= 600000) return "medium";
  return "low";
}

function ensureRiskCompatibility(userRiskProfile, productRiskLevel) {
  if (RISK_ORDER[userRiskProfile] < RISK_ORDER[productRiskLevel]) {
    throw new Error("Risk profile mismatch.");
  }
}

async function validateEligibleUser(userId, options = {}) {
  const user = await User.findByPk(userId, options);

  if (!user) throw new Error("User not found.");
  if (user.status !== "active") throw new Error("User account is not active.");
  if (user.kyc_status !== "verified") {
    throw new Error("KYC verification required before investing.");
  }

  return user;
}

async function getOrCreatePortfolio(userId, riskProfile, transaction) {
  const [portfolio] = await Portfolio.findOrCreate({
    where: { user_id: userId },
    defaults: {
      user_id: userId,
      risk_profile: riskProfile,
      total_invested: 0,
      current_value: 0,
      total_returns: 0,
    },
    transaction,
  });

  if (portfolio.risk_profile !== riskProfile) {
    portfolio.risk_profile = riskProfile;
    await portfolio.save({ transaction });
  }

  return portfolio;
}

async function recalculatePortfolio(portfolioId, transaction = null) {
  const holdings = await Holding.findAll({
    where: { portfolio_id: portfolioId },
    include: [{ model: InvestmentProduct, as: "product" }],
    transaction,
  });

  let totalInvested = 0;
  let currentValue = 0;

  for (const holding of holdings) {
    const units = parseFloat(holding.units);
    const investedAmount = parseFloat(holding.invested_amount);
    const nav = parseFloat(holding.product.nav_value);
    const holdingValue = normalizeMoney(units * nav);

    holding.current_value = holdingValue;
    await holding.save({ transaction });

    totalInvested += investedAmount;
    currentValue += holdingValue;
  }

  const portfolio = await Portfolio.findByPk(portfolioId, { transaction });
  if (!portfolio) throw new Error("Portfolio not found.");

  portfolio.total_invested = normalizeMoney(totalInvested);
  portfolio.current_value = normalizeMoney(currentValue);
  portfolio.total_returns = normalizeMoney(currentValue - totalInvested);
  await portfolio.save({ transaction });

  return portfolio;
}

async function buyInvestment(data, userId) {
  const transaction = await sequelize.transaction();

  try {
    const amount = normalizeMoney(data.amount);
    const user = await validateEligibleUser(userId, { transaction });
    
    const product = await InvestmentProduct.findByPk(data.product_id, { transaction });
    if (!product) throw new Error("Investment product not found.");
    if (product.status !== "active") throw new Error("Investment product is not active.");

    const minimumInvestment = parseFloat(product.minimum_investment);
    if (amount < minimumInvestment) {
      throw new Error(`Minimum investment threshold is ${minimumInvestment}.`);
    }

    const riskProfile = getUserRiskProfile(user);
    ensureRiskCompatibility(riskProfile, product.risk_level);

    await accountService.getAccountById(data.source_account_id, userId);
    await accountService.updateBalance(
      data.source_account_id,
      amount,
      "debit"
    );

    const portfolio = await getOrCreatePortfolio(userId, riskProfile, transaction);
    const nav = parseFloat(product.nav_value);
    const units = normalizeUnits(amount / nav);

    const [holding] = await Holding.findOrCreate({
      where: {
        portfolio_id: portfolio.portfolio_id,
        product_id: product.product_id,
      },
      defaults: {
        portfolio_id: portfolio.portfolio_id,
        product_id: product.product_id,
        units: 0,
        average_nav: nav,
        invested_amount: 0,
        current_value: 0,
      },
      transaction,
    });

    const existingUnits = parseFloat(holding.units);
    const existingInvested = parseFloat(holding.invested_amount);
    const newUnits = normalizeUnits(existingUnits + units);
    const newInvested = normalizeMoney(existingInvested + amount);

    holding.units = newUnits;
    holding.invested_amount = newInvested;
    holding.average_nav = normalizeMoney(newInvested / newUnits);
    holding.current_value = normalizeMoney(newUnits * nav);
    await holding.save({ transaction });

    const investmentTransaction = await InvestmentTransaction.create(
      {
        portfolio_id: portfolio.portfolio_id,
        product_id: product.product_id,
        source_account_id: data.source_account_id,
        transaction_type: "buy",
        amount,
        units,
        nav_at_execution: nav,
        status: "success",
      },
      { transaction }
    );

    const updatedPortfolio = await recalculatePortfolio(
      portfolio.portfolio_id,
      transaction
    );

    await auditService.createAuditLog({
      user_id: userId,
      action_type: "investment_buy",
      entity_type: "investment",
      entity_id: investmentTransaction.transaction_id,
      status: "success",
      metadata: {
        product_id: product.product_id,
        amount,
        units,
      },
    });

    await transaction.commit();

    return {
      portfolio_id: updatedPortfolio.portfolio_id,
      transaction_id: investmentTransaction.transaction_id,
      product_id: product.product_id,
      holding_units: units,
      amount,
      nav_at_execution: nav,
      status: "success",
    };
  } catch (error) {
    await transaction.rollback();

    await auditService.createAuditLog({
      user_id: userId,
      action_type: "investment_buy",
      entity_type: "investment",
      status: "failure",
      metadata: {
        product_id: data.product_id,
        amount: data.amount,
        reason: error.message,
      },
    });

    throw error;
  }
}

async function sellInvestment(data, userId) {
  const transaction = await sequelize.transaction();

  try {
    const unitsToSell = normalizeUnits(data.units);
    const user = await validateEligibleUser(userId, { transaction });
    const riskProfile = getUserRiskProfile(user);

    await accountService.getAccountById(data.source_account_id, userId);

    const product = await InvestmentProduct.findByPk(data.product_id, { transaction });
    if (!product) throw new Error("Investment product not found.");

    const portfolio = await getOrCreatePortfolio(userId, riskProfile, transaction);
    const holding = await Holding.findOne({
      where: {
        portfolio_id: portfolio.portfolio_id,
        product_id: product.product_id,
      },
      transaction,
    });

    if (!holding) throw new Error("Holding not found.");

    const existingUnits = parseFloat(holding.units);
    if (existingUnits < unitsToSell) {
      throw new Error("Insufficient holding units.");
    }

    const nav = parseFloat(product.nav_value);
    const redemptionAmount = normalizeMoney(unitsToSell * nav);
    const averageNav = parseFloat(holding.average_nav);
    const investedReduction = normalizeMoney(unitsToSell * averageNav);
    const remainingUnits = normalizeUnits(existingUnits - unitsToSell);

    await accountService.updateBalance(
      data.source_account_id,
      redemptionAmount,
      "credit"
    );

    if (remainingUnits <= 0) {
      await holding.destroy({ transaction });
    } else {
      holding.units = remainingUnits;
      holding.invested_amount = normalizeMoney(
        parseFloat(holding.invested_amount) - investedReduction
      );
      holding.current_value = normalizeMoney(remainingUnits * nav);
      await holding.save({ transaction });
    }

    const investmentTransaction = await InvestmentTransaction.create(
      {
        portfolio_id: portfolio.portfolio_id,
        product_id: product.product_id,
        source_account_id: data.source_account_id,
        transaction_type: "sell",
        amount: redemptionAmount,
        units: unitsToSell,
        nav_at_execution: nav,
        status: "success",
      },
      { transaction }
    );

    const updatedPortfolio = await recalculatePortfolio(
      portfolio.portfolio_id,
      transaction
    );

    await auditService.createAuditLog({
      user_id: userId,
      action_type: "investment_sell",
      entity_type: "investment",
      entity_id: investmentTransaction.transaction_id,
      status: "success",
      metadata: {
        product_id: product.product_id,
        amount: redemptionAmount,
        units: unitsToSell,
      },
    });

    await transaction.commit();

    return {
      portfolio_id: updatedPortfolio.portfolio_id,
      transaction_id: investmentTransaction.transaction_id,
      product_id: product.product_id,
      redeemed_units: unitsToSell,
      redemption_amount: redemptionAmount,
      nav_at_execution: nav,
      status: "success",
    };
  } catch (error) {
    await transaction.rollback();

    await auditService.createAuditLog({
      user_id: userId,
      action_type: "investment_sell",
      entity_type: "investment",
      status: "failure",
      metadata: {
        product_id: data.product_id,
        units: data.units,
        reason: error.message,
      },
    });

    throw error;
  }
}

async function getPortfolio(userId) {
  const portfolio = await Portfolio.findOne({
    where: { user_id: userId },
  });

  if (!portfolio) {
    return {
      portfolio: null,
      holdings: [],
    };
  }

  await recalculatePortfolio(portfolio.portfolio_id);

  const refreshedPortfolio = await Portfolio.findByPk(portfolio.portfolio_id);
  const holdings = await Holding.findAll({
    where: { portfolio_id: portfolio.portfolio_id },
    include: [{ model: InvestmentProduct, as: "product" }],
    order: [["created_at", "DESC"]],
  });

  return {
    portfolio: refreshedPortfolio,
    holdings,
  };
}

async function generateInvestmentStatement(userId) {
  const portfolioData = await getPortfolio(userId);

  if (!portfolioData.portfolio) {
    return {
      portfolio: null,
      holdings: [],
      transactions: [],
    };
  }

  const transactions = await InvestmentTransaction.findAll({
    where: { portfolio_id: portfolioData.portfolio.portfolio_id },
    include: [{ model: InvestmentProduct, as: "product" }],
    order: [["created_at", "DESC"]],
  });

  return {
    ...portfolioData,
    transactions,
  };
}

async function getActiveProducts() {
  return await InvestmentProduct.findAll({
    where: { status: "active" },
    order: [["investment_type", "ASC"], ["risk_level", "ASC"], ["product_name", "ASC"]],
  });
}

async function getMarketOverview() {
  const products = await getActiveProducts();
  const productIds = products.map((product) => product.product_id);

  const navHistory = await NavHistory.findAll({
    where: { product_id: productIds },
    order: [["nav_date", "ASC"]],
  });

  const historyByProduct = navHistory.reduce((acc, item) => {
    if (!acc[item.product_id]) acc[item.product_id] = [];
    acc[item.product_id].push({
      nav_date: item.nav_date,
      nav_value: Number(item.nav_value),
    });
    return acc;
  }, {});

  return products.map((product) => {
    const history = historyByProduct[product.product_id] || [];
    const first = history[0]?.nav_value || Number(product.nav_value);
    const latest = Number(product.nav_value);
    const changePercent = first > 0 ? ((latest - first) / first) * 100 : 0;

    return {
      ...product.toJSON(),
      nav_history: history,
      change_percent: Number(changePercent.toFixed(2)),
    };
  });
}

async function getProductNavHistory(productId) {
  const product = await InvestmentProduct.findByPk(productId);
  if (!product) throw new Error("Investment product not found.");

  return await NavHistory.findAll({
    where: { product_id: productId },
    order: [["nav_date", "ASC"]],
  });
}

module.exports = {
  buyInvestment,
  sellInvestment,
  getPortfolio,
  generateInvestmentStatement,
  recalculatePortfolio,
  getActiveProducts,
  getMarketOverview,
  getProductNavHistory,
};
