/**
 * /services/credit-card-service/jobs/billingCycle.js
 * Automated monthly billing generation for PostgreSQL.
 */
const CreditCard = require('../models/creditcard.model');
const logger = require('../../../shared/utils/logger');
const statementGenerator = require('./statementGenerator');
const processMonthlyBilling = async () => {
    try {
        // 1. Fetch all active AND blocked cards that have outstanding balance
        // Blocked cards must still accrue interest — blocking does not pause debt
        const cards = await CreditCard.findAll({
            where: { status: ['active', 'blocked'] }
        });

        const today = new Date();

        for (let card of cards) {
            const currentBalance = parseFloat(card.outstanding_balance);

            // Skip cards with zero balance — nothing to bill
            if (currentBalance <= 0) {
                logger.info(`Card ${card.card_id} has zero balance, skipping billing`);
                continue;
            }

            /**
             * 2. Penalty Check
             * If due_date has passed and balance still outstanding → apply penalty
             */
            let penaltyCharged = 0;
            let penaltyApplied = card.penalty_applied;

            if (card.due_date) {
                const dueDate = new Date(card.due_date);
                const isOverdue = today > dueDate;

                if (isOverdue && !card.penalty_applied) {
                    const penaltyRate = parseFloat(card.penalty_rate); // e.g. 0.02
                    penaltyCharged = currentBalance * penaltyRate;
                    penaltyApplied = true;
                    logger.info(`Penalty of ₹${penaltyCharged.toFixed(2)} applied to Card ${card.card_id} (overdue since ${card.due_date})`);
                }
            }

            /**
             * 3. Apply Revolving Interest
             * Interest = Outstanding Balance * monthly interest rate
             */
            const monthlyRate = parseFloat(card.interest_rate); // already monthly e.g. 0.036
            const interestCharged = currentBalance * monthlyRate;

            /**
             * 4. New Balance = current + interest + penalty
             */
            const newBalance = currentBalance + interestCharged + penaltyCharged;

            /**
             * 5. Minimum Due = 5% of new outstanding balance
             */
            const newMinimumDue = newBalance * 0.05;

            /**
             * 6. Advance due_date by 30 days from today for next cycle
             */
            const nextDueDate = new Date(today);
            nextDueDate.setDate(nextDueDate.getDate() + 30);
            const nextDueDateStr = nextDueDate.toISOString().split('T')[0];
            const todayStr = today.toISOString().split('T')[0];

            // 7. Recalculate available_limit correctly
            // available_limit = credit_limit - new_balance (floored at 0)
            // This prevents available_limit from going stale/incorrect after interest inflation
            const recalculatedAvailableLimit = Math.max(
                0,
                parseFloat(card.credit_limit) - newBalance
            );

            // 8. Persist all updates
            await card.update({
                outstanding_balance: newBalance,
                minimum_due: newMinimumDue,
                available_limit: recalculatedAvailableLimit,
                due_date: nextDueDateStr,
                last_billing_date: todayStr,
                // Reset penalty_applied only if a penalty was actually applied this cycle
                // so it doesn't unintentionally clear pre-existing state
                penalty_applied: penaltyApplied ? false : card.penalty_applied,
                billing_cycle_date: card.billing_cycle_date
            });

            logger.info(`Billing processed for Card ${card.card_id}: interest=₹${interestCharged.toFixed(2)}, penalty=₹${penaltyCharged.toFixed(2)}, new_balance=₹${newBalance.toFixed(2)}, next_due=${nextDueDateStr}`);

            // 8. Trigger statement generation for this card
            await statementGenerator.generateCardStatement(card.card_id);
        }
    } catch (error) {
        logger.error(`Monthly billing job failed: ${error.message}`);
    }
};

module.exports = processMonthlyBilling;