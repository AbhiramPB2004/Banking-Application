/**
 * /services/credit-card-service/jobs/billingCycle.js
 * Automated monthly billing generation for PostgreSQL.
 */
const CreditCard = require('../models/creditCard.model');
const logger = require('../../shared/utils/logger'); // [cite: 2473]
const statementGenerator = require('./statementGenerator'); // [cite: 2482]

const processMonthlyBilling = async () => {
    try {
        // 1. Fetch all active cards using Sequelize 
        const cards = await CreditCard.findAll({ 
            where: { status: 'active' } 
        });

        for (let card of cards) {
            /**
             * 2. Apply Revolving Interest 
             * Interest = (Outstanding Balance * APR) / 12 months
             */
            const currentBalance = parseFloat(card.outstanding_balance);
            const monthlyRate = parseFloat(card.interest_rate) / 12;
            const interestCharged = currentBalance * monthlyRate;

            const newBalance = currentBalance + interestCharged;

            /**
             * 3. Calculate Minimum Due [cite: 2458]
             * Standardized at 5% of the new outstanding balance.
             */
            const newMinimumDue = newBalance * 0.05;

            // 4. Persistence: Update the record in PostgreSQL [cite: 2457, 2466]
            await card.update({
                outstanding_balance: newBalance,
                minimum_due: newMinimumDue,
                // Update the billing cycle date for the next month
                billing_cycle_date: card.billing_cycle_date 
            });

            logger.info(`Billing processed for Card ID: ${card.card_id}`); // [cite: 2484]

            /**
             * 5. Trigger Statement Generation [cite: 2482]
             * Passes the updated card data to create the monthly report.
             */
            await statementGenerator.generateCardStatement(card.card_id); 
        }
    } catch (error) {
        logger.error(`Monthly billing job failed: ${error.message}`); // [cite: 2484]
    }
};

module.exports = processMonthlyBilling;