/**
 * /services/credit-card-service/routes/creditCard.routes.js
 * Maps credit card endpoints for PostgreSQL-backed infrastructure.
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const creditCardController = require(path.join(__dirname, '../controllers/creditcard.controller'));

// (Ensure your authMiddleware path is correct depending on your folder name: middleware vs middlewares)
const authenticate = require('../../../shared/middleware/authMiddleware');
/**
 * ROUTE SECURITY PRINCIPLE:
 * We apply authentication globally to all routes in this file.
 * The controller will derive req.user.user_id from the verified token.
 */
router.use(authenticate);

// Apply for credit card: Trigger issuance logic
router.post('/apply', creditCardController.applyNewCard); 

// Retrieve card details: Fetch relational card profile
router.get('/:id', creditCardController.getCardDetails); 

// --- Transactional Operations ---
// Card purchase simulation: Spend against available credit limit
router.post('/purchase', creditCardController.processCardPurchase);

// Repay outstanding dues: Update balances in PostgreSQL
router.post('/payment', creditCardController.makeCardPayment); 


// --- Lifecycle & Security Management ---
// Security freeze: Block card lifecycle state
router.patch('/block/:id', creditCardController.blockCustomerCard);

// Lifecycle closure: Close card record
router.patch('/close/:id', creditCardController.closeCard);

// Statement retrieval: Fetch monthly billing reports
router.get('/statement/:id', creditCardController.generateCardStatement);

module.exports = router;