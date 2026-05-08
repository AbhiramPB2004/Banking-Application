// /services/investment-service/jobs/productSeeder.js

const InvestmentProduct = require("../models/investmentProduct.model");
const NavHistory = require("../models/navHistory.model");
const logger = require("../../../shared/utils/logger");

const DEFAULT_INVESTMENT_PRODUCTS = [
  {
    product_name: "Horizon Liquid Saver Fund",
    investment_type: "mutual_fund",
    risk_level: "low",
    nav_value: 102.45,
    minimum_investment: 500,
    expense_ratio: 0.25,
    status: "active",
  },
  {
    product_name: "Horizon Corporate Bond Plan",
    investment_type: "bond",
    risk_level: "low",
    nav_value: 1000,
    minimum_investment: 5000,
    expense_ratio: 0.15,
    status: "active",
  },
  {
    product_name: "Horizon Balanced Growth Fund",
    investment_type: "mutual_fund",
    risk_level: "medium",
    nav_value: 186.72,
    minimum_investment: 1000,
    expense_ratio: 0.85,
    status: "active",
  },
  {
    product_name: "Horizon Digital Gold",
    investment_type: "gold",
    risk_level: "medium",
    nav_value: 6250,
    minimum_investment: 100,
    expense_ratio: 0.5,
    status: "active",
  },
  {
    product_name: "Horizon Bluechip Equity",
    investment_type: "equity",
    risk_level: "high",
    nav_value: 428.34,
    minimum_investment: 1000,
    expense_ratio: 1.1,
    status: "active",
  },
  {
    product_name: "Horizon Small Cap Opportunities",
    investment_type: "equity",
    risk_level: "high",
    nav_value: 74.91,
    minimum_investment: 1000,
    expense_ratio: 1.35,
    status: "active",
  },
];

async function seedDefaultInvestmentProducts() {
  let createdCount = 0;

  for (const product of DEFAULT_INVESTMENT_PRODUCTS) {
    const [record, created] = await InvestmentProduct.findOrCreate({
      where: { product_name: product.product_name },
      defaults: product,
    });

    if (!created && record.status !== "active") {
      record.status = "active";
      await record.save();
    }

    if (created) createdCount++;

    await seedNavHistory(record);
  }

  logger.info(
    `[Investment Seeder] ${createdCount} default products created.`
  );

  return createdCount;
}

async function seedNavHistory(product) {
  const existingCount = await NavHistory.count({
    where: { product_id: product.product_id },
  });

  if (existingCount > 0) return;

  const today = new Date();
  const currentNav = Number(product.nav_value);
  const volatilityByRisk = {
    low: 0.003,
    medium: 0.008,
    high: 0.016,
  };
  const dailyDriftByRisk = {
    low: 0.0008,
    medium: 0.0015,
    high: 0.0022,
  };
  const volatility = volatilityByRisk[product.risk_level] || 0.006;
  const dailyDrift = dailyDriftByRisk[product.risk_level] || 0.001;
  const rows = [];

  for (let index = 29; index >= 0; index--) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);

    const age = index / 29;
    const cycle = Math.sin((29 - index) / 3) * volatility;
    const nav = currentNav * (1 - age * 0.06 + (29 - index) * dailyDrift + cycle);

    rows.push({
      product_id: product.product_id,
      nav_value: Math.max(1, Number(nav.toFixed(4))),
      nav_date: date.toISOString().split("T")[0],
    });
  }

  await NavHistory.bulkCreate(rows, {
    ignoreDuplicates: true,
  });
}

module.exports = {
  DEFAULT_INVESTMENT_PRODUCTS,
  seedDefaultInvestmentProducts,
  seedNavHistory,
};
