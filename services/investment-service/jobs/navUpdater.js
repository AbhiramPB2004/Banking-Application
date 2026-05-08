// /services/investment-service/jobs/navUpdater.js

const cron = require("node-cron");
const InvestmentProduct = require("../models/investmentProduct.model");
const NavHistory = require("../models/navHistory.model");
const investmentService = require("../services/investmentService");
const logger = require("../../../shared/utils/logger");

function simulateNavMovement(currentNav) {
  const movementPercent = Math.random() * 0.04 - 0.02; // -2% to +2%
  const nextNav = Math.max(1, currentNav * (1 + movementPercent));
  return parseFloat(nextNav.toFixed(4));
}

async function updateNavValues() {
  try {
    const products = await InvestmentProduct.findAll({
      where: { status: "active" },
    });

    const today = new Date().toISOString().split("T")[0];

    for (const product of products) {
      product.nav_value = simulateNavMovement(parseFloat(product.nav_value));
      await product.save();

      await NavHistory.upsert({
        product_id: product.product_id,
        nav_value: product.nav_value,
        nav_date: today,
      });

      const holdings = await product.getHoldings();
      const portfolioIds = new Set(holdings.map((holding) => holding.portfolio_id));

      for (const portfolioId of portfolioIds) {
        await investmentService.recalculatePortfolio(portfolioId);
      }
    }

    logger.info(`[NAV Updater] Updated ${products.length} active investment products.`);
    return products.length;
  } catch (error) {
    logger.error(`[NAV Updater] Error: ${error.message}`);
    throw error;
  }
}

function startNavUpdater() {
  cron.schedule("0 2 * * *", () => {
    logger.info("[NAV Updater] Running daily NAV simulation...");
    updateNavValues();
  });

  logger.info("[NAV Updater] Cron job registered (daily at 2 AM).");
}

module.exports = {
  startNavUpdater,
  updateNavValues,
  simulateNavMovement,
};
