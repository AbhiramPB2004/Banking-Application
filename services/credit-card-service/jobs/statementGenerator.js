/**
 * /services/credit-card-service/jobs/statementGenerator.js
 * Updated for PostgreSQL to handle monthly billing summaries.
 */
const { Op } = require('sequelize');
const CreditCard = require('../models/creditcard.model');
const logger = require('../../../shared/utils/logger');

const generateMonthlyStatements = async () => {
    try {
        // 1. Identify active and blocked cards for the current billing cycle
        // Blocked cards still have outstanding balances that need statements
        const activeCards = await CreditCard.findAll({
            where: { status: ['active', 'blocked'] }
        });

        for (const card of activeCards) {
            /**
             * 2. Compile Statement Metadata
             * NOTE: Transaction model is not currently linked to CreditCard in this service.
             * Future: import Transaction model and join on card_id.
             * For now, derive statement from card snapshot only.
             */
            const billingStart = card.last_billing_date || card.createdAt;

            const statementData = {
                card_id: card.card_id,
                user_id: card.user_id,
                billing_period_start: billingStart,
                billing_period_end: new Date().toISOString().split('T')[0],
                outstanding_balance: parseFloat(card.outstanding_balance),
                minimum_due: parseFloat(card.minimum_due),
                available_limit: parseFloat(card.available_limit),
                credit_limit: parseFloat(card.credit_limit),
                due_date: card.due_date,
                penalty_applied: card.penalty_applied
            };

            /**
             * 3. Statement Logging & Finalization
             * Future expansions: PDF generation, automated email dispatch,
             * and persistence to a BillingRecords table.
             */
            logger.info(`Statement metadata compiled for Card: ${card.card_number} | Balance: ₹${statementData.outstanding_balance} | Min Due: ₹${statementData.minimum_due}`);

            // TODO: persist statementData to a BillingRecords table
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