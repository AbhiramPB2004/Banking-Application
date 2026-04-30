/**
 * /services/credit-card-service/jobs/paymentReminder.js
 * Automated payment notifications for PostgreSQL environment.
 */
const { Op } = require('sequelize');
const CreditCard = require('../models/creditcard.model'); 
const notificationService = require('../../notification-service/services/notificationService'); 
const logger = require('../../../shared/utils/logger'); 
const runPaymentReminders = async () => {
    try {
        const today = new Date();
        const reminderWindow = new Date();
        reminderWindow.setDate(today.getDate() + 3); // 3-day buffer for reminders 

        /**
         * Find active cards with an upcoming due date and outstanding balance.
         * Sequelize handles the numeric DECIMAL types and Date comparisons for Postgres.
         */
        const upcomingPayments = await CreditCard.findAll({
            where: {
                status: 'active', // 
                outstanding_balance: {
                    [Op.gt]: 0 // Only remind if there is money owed 
                },
                due_date: {
                    [Op.lte]: reminderWindow,
                    [Op.gte]: today
                }
            }
        });

        for (const card of upcomingPayments) {
            /**
             * Trigger inter-service dependency: Notification Service.
             * This follows the Communication Lifecycle ownership rules. 
             */
            await notificationService.sendCreditCardReminder({
                user_id: card.user_id, // Derived from cardholder mapping 
                amount_due: card.minimum_due, // Minimum due calculations 
                due_date: card.due_date
            });
            
            logger.info(`Payment reminder sent to user ${card.user_id} for card ${card.card_id}`);
        }
    } catch (error) {
        logger.error(`Payment reminder job failed: ${error.message}`); 
    }
};

module.exports = runPaymentReminders;