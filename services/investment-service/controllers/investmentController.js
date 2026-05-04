// /services/investment-service/controllers/investmentController.js

const investmentService = require("../services/investmentService");
const {
  validateBuyInput,
  validateSellInput,
} = require("../validators/investmentValidator");
const responseFormatter = require("../../../shared/utils/responseFormatter");
const logger = require("../../../shared/utils/logger");

async function buyInvestmentProduct(req, res) {
  try {
    const validation = validateBuyInput(req.body);

    if (!validation.valid) {
      return res
        .status(400)
        .json(responseFormatter.error("Validation failed.", validation.errors));
    }

    const result = await investmentService.buyInvestment(
      req.body,
      req.user.user_id
    );

    return res
      .status(201)
      .json(responseFormatter.success(result, "Investment purchased successfully."));
  } catch (error) {
    logger.error(`Investment buy failed: ${error.message}`);
    return res.status(400).json(responseFormatter.error(error.message));
  }
}

async function sellInvestmentProduct(req, res) {
  try {
    const validation = validateSellInput(req.body);

    if (!validation.valid) {
      return res
        .status(400)
        .json(responseFormatter.error("Validation failed.", validation.errors));
    }

    const result = await investmentService.sellInvestment(
      req.body,
      req.user.user_id
    );

    return res
      .status(200)
      .json(responseFormatter.success(result, "Investment redeemed successfully."));
  } catch (error) {
    logger.error(`Investment sell failed: ${error.message}`);
    return res.status(400).json(responseFormatter.error(error.message));
  }
}

async function getPortfolio(req, res) {
  try {
    const result = await investmentService.getPortfolio(req.user.user_id);

    return res
      .status(200)
      .json(responseFormatter.success(result, "Portfolio retrieved successfully."));
  } catch (error) {
    logger.error(`Portfolio retrieval failed: ${error.message}`);
    return res.status(500).json(responseFormatter.error(error.message));
  }
}

async function generatePortfolioStatement(req, res) {
  try {
    const result = await investmentService.generateInvestmentStatement(
      req.user.user_id
    );

    return res
      .status(200)
      .json(responseFormatter.success(result, "Statement generated successfully."));
  } catch (error) {
    logger.error(`Statement generation failed: ${error.message}`);
    return res.status(500).json(responseFormatter.error(error.message));
  }
}

async function getProducts(req, res) {
  try {
    const result = await investmentService.getActiveProducts();

    return res
      .status(200)
      .json(responseFormatter.success(result, "Investment products retrieved successfully."));
  } catch (error) {
    logger.error(`Investment product retrieval failed: ${error.message}`);
    return res.status(500).json(responseFormatter.error(error.message));
  }
}

async function getMarketOverview(req, res) {
  try {
    const result = await investmentService.getMarketOverview();

    return res
      .status(200)
      .json(responseFormatter.success(result, "Market overview retrieved successfully."));
  } catch (error) {
    logger.error(`Market overview retrieval failed: ${error.message}`);
    return res.status(500).json(responseFormatter.error(error.message));
  }
}

async function getProductNavHistory(req, res) {
  try {
    const result = await investmentService.getProductNavHistory(req.params.id);

    return res
      .status(200)
      .json(responseFormatter.success(result, "NAV history retrieved successfully."));
  } catch (error) {
    logger.error(`NAV history retrieval failed: ${error.message}`);
    return res.status(404).json(responseFormatter.error(error.message));
  }
}

module.exports = {
  buyInvestmentProduct,
  sellInvestmentProduct,
  getPortfolio,
  generatePortfolioStatement,
  getProducts,
  getMarketOverview,
  getProductNavHistory,
};
