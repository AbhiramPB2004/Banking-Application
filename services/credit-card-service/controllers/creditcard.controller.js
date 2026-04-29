/**
 * /services/credit-card-service/controllers/creditcard.controller.js
 */
const creditCardService = require('../services/creditcard.service'); 
const responseFormatter = require('../../../shared/utils/responseFormatter'); 
const logger = require('../../../shared/utils/logger');

// 🚨 UPDATE 1: Import the User model to fetch real database profiles
const User = require('../../user-service/models/user.model'); 

/**
 * Apply for a new Credit Card
 */
exports.applyNewCard = async (req, res) => {
    try {
        // 🚨 UPDATE 2: Fetch the actual user profile from the database
        const userProfile = await User.findByPk(req.user.user_id);
        
        if (!userProfile) {
            return res.status(404).json(responseFormatter.error("User not found"));
        }

        /**
         * Identity trust enforcement: 
         * Merge the trusted database facts with the application body.
         */
        const cardData = {
            ...req.body,
            user_id: req.user.user_id, // Security: derive identity from token, not body
            kyc_status: userProfile.kyc_status, // Real KYC from DB
            annual_income: userProfile.annual_income, // Real Income from DB
            occupation: userProfile.occupation, // Real Occupation from DB
            existing_liabilities: req.body.existing_liabilities || 0 // Default to 0
        };

        const result = await creditCardService.applyForCreditCard(cardData);

        return res.status(201).json(
            responseFormatter.success(result, "Credit card application successful")
        );
        
    } catch (error) {
        logger.error(`Credit Card Application Failure: ${error.message}`);
        
        const statusCode = error.name === 'SequelizeUniqueConstraintError' ? 409 : 400;
        return res.status(statusCode).json(responseFormatter.error(error.message));
    }
};

/**
 * Get Card Details
 */
exports.getCardDetails = async (req, res) => {
    try {
        const { cardId } = req.params;
        const result = await creditCardService.getCardById(cardId, req.user.user_id);
        
        return res.status(200).json(responseFormatter.success(result));
    } catch (error) {
        logger.error(`Fetch Card Error: ${error.message}`);
        return res.status(404).json(responseFormatter.error(error.message));
    }
};

/**
 * Process a purchase (Transaction)
 */
exports.processCardPurchase = async (req, res) => {
    try {
        const result = await creditCardService.processTransaction({
            ...req.body,
            user_id: req.user.user_id
        });
        return res.status(200).json(responseFormatter.success(result, "Transaction approved"));
    } catch (error) {
        return res.status(400).json(responseFormatter.error(error.message));
    }
};

/**
 * Make a payment towards card balance
 */
exports.makeCardPayment = async (req, res) => {
    try {
        const result = await creditCardService.repayBalance(req.body);
        return res.status(200).json(responseFormatter.success(result, "Payment successful"));
    } catch (error) {
        return res.status(400).json(responseFormatter.error(error.message));
    }
};

/**
 * Block/Freeze a customer card
 */
exports.blockCustomerCard = async (req, res) => {
    try {
        const { cardId } = req.params;
        const result = await creditCardService.updateCardStatus(cardId, 'blocked');
        return res.status(200).json(responseFormatter.success(result, "Card has been blocked"));
    } catch (error) {
        return res.status(400).json(responseFormatter.error(error.message));
    }
};

// Add this at the end of the file
module.exports = {
    applyNewCard: exports.applyNewCard,
    getCardDetails: exports.getCardDetails,
    processCardPurchase: exports.processCardPurchase,
    makeCardPayment: exports.makeCardPayment,
    blockCustomerCard: exports.blockCustomerCard,
    // Add these placeholders so your routes don't crash 
    // until you write the logic in the service
    closeCard: async (req, res) => res.status(501).json({ message: "Not Implemented" }),
    generateCardStatement: async (req, res) => res.status(501).json({ message: "Not Implemented" })
};