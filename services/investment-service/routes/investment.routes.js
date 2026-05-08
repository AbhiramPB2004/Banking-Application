// /services/investment-service/routes/investment.routes.js

const express = require("express");
const router = express.Router();
const investmentController = require("../controllers/investmentController");

router.get("/products", investmentController.getProducts);
router.get("/market", investmentController.getMarketOverview);
router.get("/products/:id/nav-history", investmentController.getProductNavHistory);
router.post("/buy", investmentController.buyInvestmentProduct);
router.post("/sell", investmentController.sellInvestmentProduct);
router.get("/portfolio/me", investmentController.getPortfolio);
router.get("/statement/me", investmentController.generatePortfolioStatement);

module.exports = router;
