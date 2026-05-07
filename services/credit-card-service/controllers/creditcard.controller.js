/**
 * /services/credit-card-service/controllers/creditcard.controller.js
 */
const creditCardService = require('../services/creditcard.service');
const responseFormatter = require('../../../shared/utils/responseFormatter');
const logger = require('../../../shared/utils/logger');
const { validateCreditCardInput } = require('../validators/creditCardValidator');

// Import models to fetch real database profiles
const User = require('../../user-service/models/user.model');
const Account = require('../../account-service/models/account.model');

/**
 * Apply for a new Credit Card
 */
exports.applyNewCard = async (req, res) => {
    try {
        // 0. Validation Gate
        const validation = validateCreditCardInput(req.body, 'application');
        if (!validation.valid) {
            return res.status(400).json(responseFormatter.error(validation.errors.join(', ')));
        }

        // Fetch the actual user profile from the database
        const userProfile = await User.findByPk(req.user.user_id);

        if (!userProfile) {
            return res.status(404).json(responseFormatter.error("User not found"));
        }

        // Fetch user's existing bank account to link with the card
        const userAccount = await Account.findOne({
            where: { user_id: req.user.user_id },
            order: [['created_at', 'ASC']] // Get the first/primary account
        });

        /**
         * Identity trust enforcement: 
         * Merge the trusted database facts with the application body.
         */
        // Calculate age from dob stored in user profile
        const dob = new Date(userProfile.dob);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }

        const cardData = {
            ...req.body,
            user_id: req.user.user_id,           // Security: derive identity from token, not body
            source_account_id: userAccount ? userAccount.account_id : undefined,
            kyc_status: userProfile.kyc_status,  // Real KYC from DB
            annual_income: userProfile.annual_income, // Real Income from DB
            occupation: userProfile.occupation,  // Real Occupation from DB
            existing_liabilities: req.body.existing_liabilities || 0,
            age: age,                            // Calculated from DB dob, not user input
            card_tier: req.body.card_tier || 'entry' // 'entry' or 'premium', default entry
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
        const cardId = req.params.id;
        const result = await creditCardService.getCardById(cardId, req.user.user_id);

        return res.status(200).json(responseFormatter.success(result));
    } catch (error) {
        logger.error(`Fetch Card Error: ${error.message}`);
        return res.status(404).json(responseFormatter.error(error.message));
    }
};

/**
 * Get all cards belonging to the logged-in user
 */
exports.getUserCards = async (req, res) => {
    try {
        const result = await creditCardService.getCardsByUserId(req.user.user_id);
        return res.status(200).json(responseFormatter.success(result));
    } catch (error) {
        logger.error(`Fetch User Cards Error: ${error.message}`);
        return res.status(400).json(responseFormatter.error(error.message));
    }
};

/**
 * Process a purchase (Transaction)
 */
exports.processCardPurchase = async (req, res) => {
    try {
        // 0. Validation Gate
        const validation = validateCreditCardInput(req.body, 'purchase');
        if (!validation.valid) {
            return res.status(400).json(responseFormatter.error(validation.errors.join(', ')));
        }

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
        // 0. Validation Gate
        const validation = validateCreditCardInput(req.body, 'payment');
        if (!validation.valid) {
            return res.status(400).json(responseFormatter.error(validation.errors.join(', ')));
        }

        const result = await creditCardService.repayBalance({
            ...req.body,
            user_id: req.user.user_id
        });
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
        //CHANGE THIS LINE: Extract 'id' to match the '/block/:id' route!
        const cardId = req.params.id;

        const result = await creditCardService.updateCardStatus(cardId, req.user.user_id, 'blocked');
        return res.status(200).json(responseFormatter.success(result, "Card has been blocked"));
    } catch (error) {
        return res.status(400).json(responseFormatter.error(error.message));
    }
};

module.exports = {
    applyNewCard: exports.applyNewCard,
    getCardDetails: exports.getCardDetails,
    getUserCards: exports.getUserCards,
    processCardPurchase: exports.processCardPurchase,
    makeCardPayment: exports.makeCardPayment,
    blockCustomerCard: exports.blockCustomerCard,
    unblockCustomerCard: async (req, res) => {
        try {
            const cardId = req.params.id;
            const result = await creditCardService.updateCardStatus(cardId, req.user.user_id, 'active');
            return res.status(200).json(responseFormatter.success(result, "Card unblocked successfully"));
        } catch (error) {
            return res.status(400).json(responseFormatter.error(error.message));
        }
    },
    // Add these placeholders so your routes don't crash 
    // until you write the logic in the service
    closeCard: async (req, res) => {
        try {
            const cardId = req.params.id;
            const result = await creditCardService.updateCardStatus(cardId, req.user.user_id, 'closed');
            return res.status(200).json(responseFormatter.success(result, "Card closed successfully"));
        } catch (error) {
            return res.status(400).json(responseFormatter.error(error.message));
        }
    },
    //generateCardStatement: async (req, res) => res.status(501).json({ message: "Not Implemented" })
    generateCardStatement: async (req, res) => {
        try {
            const cardId = req.params.id;
            const result = await creditCardService.getCardStatement(cardId, req.user.user_id);
            return res.status(200).json(responseFormatter.success(result, "Statement generated successfully"));
        } catch (error) {
            return res.status(400).json(responseFormatter.error(error.message));
        }
    }
};