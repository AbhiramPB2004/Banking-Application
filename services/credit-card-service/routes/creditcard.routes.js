/**
 * /services/credit-card-service/routes/creditcard.routes.js
 * Maps credit card endpoints for PostgreSQL-backed infrastructure.
 */

const express = require('express');
const router = express.Router();
const creditCardController = require('../controllers/creditCardController');

/**
 * ROUTE SECURITY PRINCIPLE[cite: 1051]:
 * All routes rely on Gateway JWT injection for identity trust.
 * The controller will derive req.user.user_id from the verified token.
 */

// Apply for credit card: Trigger issuance logic [cite: 2479]
router.post('/apply', creditCardController.applyNewCard); 

// Retrieve card details: Fetch relational card profile [cite: 2480]
router.get('/:id', creditCardController.getCardDetails); 

// Card purchase simulation: Spend against available credit limit [cite: 2480]
router.post('/purchase', creditCardController.processCardPurchase);

// Repay outstanding dues: Update balances in PostgreSQL [cite: 2481]
router.post('/payment', creditCardController.makeCardPayment); 

// Security freeze: Block card lifecycle state [cite: 2481]
router.patch('/block/:id', creditCardController.blockCustomerCard);

// Lifecycle closure: Close card record [cite: 2481]
router.patch('/close/:id', creditCardController.closeCard);

// Statement retrieval: Fetch monthly billing reports [cite: 2482]
router.get('/statement/:id', creditCardController.generateCardStatement);

module.exports = router;