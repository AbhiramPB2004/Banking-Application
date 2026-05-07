/**
 * /services/credit-card-service/jobs/scheduler.js
 * Central cron scheduler for all credit card background jobs.
 * Called once at gateway startup after DB sync.
 */

const cron = require('node-cron');
const logger = require('../../../shared/utils/logger');

const processMonthlyBilling = require('./billingCycle');
const runPaymentReminders = require('./paymentReminder');
const { generateMonthlyStatements } = require('./statementGenerator');

function initCreditCardJobs() {
    /**
     * Billing Cycle Job
     * Runs: 1st of every month at 00:00 UTC
     * Does: Apply interest, calculate minimum due, trigger statements
     */
    cron.schedule('0 0 1 * *', async () => {
        logger.info('CRON: Monthly billing cycle started');
        await processMonthlyBilling();
        logger.info('CRON: Monthly billing cycle completed');
    }, {
        timezone: 'UTC'
    });

    /**
     * Payment Reminder Job
     * Runs: Every day at 09:00 UTC
     * Does: Find cards with due date within 3 days, send reminders
     */
    cron.schedule('0 9 * * *', async () => {
        logger.info('CRON: Payment reminder job started');
        await runPaymentReminders();
        logger.info('CRON: Payment reminder job completed');
    }, {
        timezone: 'UTC'
    });

    /**
     * Monthly Statement Generator Job
     * Runs: Last day of every month at 23:00 UTC
     * Does: Compile full month transaction statements for all active cards
     */
    cron.schedule('0 23 28-31 * *', async () => {
        // Extra guard: only run on actual last day of month
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        if (tomorrow.getDate() === 1) {
            logger.info('CRON: Monthly statement generation started');
            await generateMonthlyStatements();
            logger.info('CRON: Monthly statement generation completed');
        }
    }, {
        timezone: 'UTC'
    });

    logger.info('Credit card background jobs scheduled: billing(monthly), reminders(daily), statements(month-end)');
}

module.exports = initCreditCardJobs;
