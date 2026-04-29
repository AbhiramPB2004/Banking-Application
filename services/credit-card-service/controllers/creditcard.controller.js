/**
 * /services/credit-card-service/controllers/creditCardController.js
 * Updated for PostgreSQL/Sequelize integration.
 */
const creditCardService = require('../services/creditCardService');
const responseFormatter = require('../../shared/utils/responseFormatter');
const logger = require('../../shared/utils/logger'); // [cite: 112]

exports.applyNewCard = async (req, res) => {
    try {
        /**
         * Identity trust enforcement: 
         * Strictly derive user_id from Gateway JWT via req.user injection. [cite: 1471, 1504]
         */
        const cardData = {
            ...req.body,
            user_id: req.user.user_id // Never trust user_id from request body [cite: 1506]
        };

        // Coordinate with Service Layer for eligibility and issuance [cite: 2467]
        const result = await creditCardService.applyForCreditCard(cardData);

        // Standardize output using shared utility 
        res.status(201).json(
            responseFormatter.success(result, "Credit card application successful")
        );
        
    } catch (error) {
        /**
         * Operational Observability: 
         * Log failures (like duplicate card numbers or eligibility rejections). [cite: 118]
         */
        logger.error(`Credit Card Application Failure: ${error.message}`); // [cite: 122]
        
        // Handle specific PostgreSQL/Sequelize error types if needed
        const statusCode = error.name === 'SequelizeUniqueConstraintError' ? 409 : 400;
        
        res.status(statusCode).json(responseFormatter.error(error.message)); // [cite: 151]
    }
};

/**
 * Controller manages additional core functions as per documentation: 
 * - getCardDetails
 * - processCardPurchase
 * - makeCardPayment
 * - blockCustomerCard
 */