/**
 * /services/credit-card-service/routes/creditCard.routes.js
 *
 * Credit Card Service Routes
 *
 * Security:
 * - JWT enforced at Gateway
 * - req.user.user_id trusted
 * - Controllers handle ownership/admin checks
 */

const express = require("express");

const router = express.Router();

const creditCardController = require(
  "../controllers/creditcard.controller"
);

/**
 * Apply for new credit card
 * POST /credit-cards/apply
 */
router.post(
  "/apply",
  creditCardController.applyNewCard
);

/**
 * Retrieve all cards for the user
 * GET /credit-cards/user/me
 */
router.get(
  "/user/me",
  creditCardController.getUserCards
);

/**
 * Retrieve customer card details
 * GET /credit-cards/:id
 */
router.get(
  "/:id",
  creditCardController.getCardDetails
);

/**
 * Process card purchase
 * POST /credit-cards/purchase
 */
router.post(
  "/purchase",
  creditCardController.processCardPurchase
);

/**
 * Make credit card payment
 * POST /credit-cards/payment
 */
router.post(
  "/payment",
  creditCardController.makeCardPayment
);

/**
 * Block card
 * PATCH /credit-cards/block/:id
 */
router.patch(
  "/block/:id",
  creditCardController.blockCustomerCard
);

/**
 * Close card
 * PATCH /credit-cards/close/:id
 */
router.patch(
  "/close/:id",
  creditCardController.closeCard
);

/**
 * Generate statement
 * GET /credit-cards/statement/:id
 */
router.get(
  "/statement/:id",
  creditCardController.generateCardStatement
);

module.exports = router;