/**
 * /services/credit-card-service/jobs/statementGenerator.js
 * Updated for PostgreSQL to handle monthly billing summaries.
 */
const { Op } = require('sequelize');
const CreditCard = require('../models/creditcard.model'); 
// const Transaction = require('../../transaction-service/models/transaction.model'); 
const logger = require('../../../shared/utils/logger'); 
const generateMonthlyStatements = async () => {
    try {
        // 1. Identify active cards for the current billing cycle 
        const activeCards = await CreditCard.findAll({ 
            where: { status: 'active' } 
        });

        for (const card of activeCards) {
            /**
             * 2. Fetch Transactions for the Billing Period
             * Uses Sequelize Operators to find transactions between the last billing date and now.
             */
            const billingPeriodTransactions = await Transaction.findAll({
                where: {
                    card_id: card.card_id,
                    createdAt: {
                        [Op.gte]: card.last_billing_date || card.createdAt // Fallback to card creation date if last billing date is missing
                    }
                }
            });

            /**
             * 3. Compile Statement Metadata
             * Standardized billing summary based on banking product ownership.
             */
            const statementData = {
                card_id: card.card_id, 
                user_id: card.user_id, 
                total_spent: parseFloat(card.outstanding_balance), // SQL Decimal to Number 
                min_due: parseFloat(card.minimum_due), 
                due_date: card.due_date, 
                transactions: billingPeriodTransactions
            };

            /**
             * 4. Statement Logging & Finalization
             * Future expansions include PDF generation and automated email dispatch.
             */
            logger.info(`Statement metadata compiled for Card: ${card.card_number}`); 
            
            // Logic to persist statement metadata to a BillingRecords table would go here 
        }
    } catch (error) {
        logger.error(`Statement generation job failed: ${error.message}`);
    }
};

module.exports = {
    generateMonthlyStatements,
    generateCardStatement: async (card_id) => {
        // Single card statement trigger called by billingCycle per card
        try {
            const card = await CreditCard.findByPk(card_id);
            if (!card) {
                logger.warn(`Statement generation skipped: Card ${card_id} not found`);
                return;
            }
            logger.info(`Statement generated for Card: ${card.card_number}`);
            // Future: persist to BillingRecords table or generate PDF here
        } catch (error) {
            logger.error(`Statement generation failed for Card ${card_id}: ${error.message}`);
        }
    }
};