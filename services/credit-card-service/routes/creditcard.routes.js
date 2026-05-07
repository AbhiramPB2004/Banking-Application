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

router.get(
  "/user/me",
  creditCardController.getUserCards
);

/**
 * Generate statement
 * GET /credit-cards/statement/:id
 */
router.get(
  "/statement/:id",
  creditCardController.generateCardStatement
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
 * Unblock card
 * PATCH /credit-cards/unblock/:id
 */
router.patch(
  "/unblock/:id",
  creditCardController.unblockCustomerCard
);

/**
 * Close card (soft-delete — status → 'closed')
 * Requires zero outstanding balance.
 * PATCH /credit-cards/close/:id
 */
router.patch(
  "/close/:id",
  creditCardController.closeCard
);

/**
 * Hard-delete a closed card record.
 * Card must already be in 'closed' status with zero balance.
 * DELETE /credit-cards/:id
 */
router.delete(
  "/:id",
  creditCardController.deleteCard
);

module.exports = router;