/**
 * /services/credit-card-service/services/creditcard.service.js
 * Handles credit card business logic with PostgreSQL.
 */
const CreditCard = require('../models/creditcard.model');
const creditScoreCalculator = require('../../../shared/utils/creditScoreCalculator');
const accountService = require('../../../services/account-service/services/accountService');

class CreditCardService {
    async applyForCreditCard(data) {
        // Eligibility check using shared utility
        const eligibility = creditScoreCalculator.calculateCreditScore(data);
        console.log(eligibility)
        if (!eligibility.eligible) throw new Error("Credit eligibility failed");

        // Fetch user's bank account
        const account = await accountService.getAccountByUserId(data.user_id);
        if (!account) throw new Error("Linked bank account not found");

        // Calculate capped credit limit: 10% of balance or requested limit (whichever is lower)
        const allowedLimit = account.balance * 0.10;
        const finalLimit = Math.min(data.requested_limit, allowedLimit);

        // Assign credit limit based on eligibility score and balance cap
        // Set first due date: 20 days from today
        const firstDueDate = new Date();
        firstDueDate.setDate(firstDueDate.getDate() + 20);
        const dueDateStr = firstDueDate.toISOString().split('T')[0];

        // Set billing start date as today
        const today = new Date().toISOString().split('T')[0];

        return await CreditCard.create({
            user_id: data.user_id,
            linked_account_id: data.source_account_id || '00000000-0000-0000-0000-000000000000',
            card_number: this.generateCardNumber(),
            card_type: 'VISA_PREMIUM',
            credit_limit: finalLimit,
            available_limit: finalLimit,
            billing_cycle_date: 1,
            due_date: dueDateStr,
            last_billing_date: today,
            interest_rate: 0.0360,
            penalty_rate: 0.0200,
            penalty_applied: false
        });
    }

    generateCardNumber() {
        // Banking structure compliance
        return Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('');
    }

    // Handles purchases and deducts from the available limit
    async processTransaction(data) {
        const { card_id, user_id, amount } = data;

        // 1. Fetch the card and verify ownership
        const card = await CreditCard.findOne({ where: { card_id, user_id } });
        if (!card) {
            throw new Error("Credit card not found or unauthorized");
        }

        // 2. Security Check: Is the card active?
        if (card.status !== 'active') {
            throw new Error("Cannot process transaction: Card is not active");
        }

        // 3. Financial Math: Check limits
        const transactionAmount = parseFloat(amount);

        // Guard: amount must be present and positive
        if (!amount || isNaN(transactionAmount) || transactionAmount <= 0) {
            throw new Error("Transaction amount must be a positive number");
        }

        const availableLimit = parseFloat(card.available_limit);

        if (availableLimit < transactionAmount) {
            throw new Error("Transaction declined: Insufficient available credit limit");
        }

        // 4. Update the balances
        card.available_limit = availableLimit - transactionAmount;
        card.outstanding_balance = parseFloat(card.outstanding_balance) + transactionAmount;

        // 5. Save the updated numbers to PostgreSQL
        await card.save();

        return {
            card_id: card.card_id,
            transaction_amount: transactionAmount,
            remaining_limit: card.available_limit,
            outstanding_balance: card.outstanding_balance
        };
    }

    // Retrieves card details safely
    async getCardById(card_id, user_id) {
        // Fetch the card and verify the user actually owns it
        const card = await CreditCard.findOne({
            where: { card_id, user_id }
        });

        if (!card) {
            throw new Error("Credit card not found or unauthorized access.");
        }

        const today = new Date();
        const dueDate = card.due_date ? new Date(card.due_date) : null;
        const isOverdue = dueDate ? today > dueDate : false;

        return {
            card_id: card.card_id,
            card_number: card.card_number,
            card_type: card.card_type,
            credit_limit: parseFloat(card.credit_limit),
            available_limit: parseFloat(card.available_limit),
            outstanding_balance: parseFloat(card.outstanding_balance),
            minimum_due: parseFloat(card.minimum_due),
            due_date: card.due_date || null,
            is_overdue: isOverdue,
            penalty_applied: card.penalty_applied,
            interest_rate_monthly: parseFloat(card.interest_rate),
            billing_cycle_date: card.billing_cycle_date,
            status: card.status
        };
    }

    // Make a Payment
    async repayBalance(data) {
        const { card_id, user_id, payment_amount } = data;

        const card = await CreditCard.findOne({ where: { card_id, user_id } });
        if (!card) {
            throw new Error("Credit card not found or unauthorized access");
        }

        // Block payments on closed cards
        if (card.status === 'closed') {
            throw new Error("Cannot process payment: Card is permanently closed");
        }

        const payment = parseFloat(payment_amount);

        const previousBalance = parseFloat(card.outstanding_balance);

        // Capture penalty state BEFORE any changes
        const hadPenaltyBefore = card.penalty_applied === true;

        // Guard: payment must be positive
        if (payment <= 0) {
            throw new Error("Payment amount must be greater than zero");
        }

        // Guard: payment cannot exceed outstanding balance
        if (payment > previousBalance) {
            throw new Error(`Payment amount ₹${payment} exceeds outstanding balance ₹${previousBalance.toFixed(2)}`);
        }

        // Math: Reduce balance, restore available limit
        card.outstanding_balance = previousBalance - payment;
        card.available_limit = parseFloat(card.available_limit) + payment;

        /**
         * If balance fully cleared → reset penalty flag + advance due date 30 days
         * If partial payment → keep penalty_applied as-is, due date unchanged
         */
        if (card.outstanding_balance <= 0) {
            card.outstanding_balance = 0;
            card.available_limit = parseFloat(card.credit_limit); // Restore full limit
            card.penalty_applied = false;
            card.minimum_due = 0;
            const nextDue = new Date();
            nextDue.setDate(nextDue.getDate() + 30);
            card.due_date = nextDue.toISOString().split('T')[0];
        }

        await card.save();

        return {
            card_id: card.card_id,
            payment_applied: payment,
            previous_balance: previousBalance,
            new_outstanding_balance: parseFloat(card.outstanding_balance),
            restored_available_limit: parseFloat(card.available_limit),
            penalty_cleared: hadPenaltyBefore && card.penalty_applied === false,
            next_due_date: card.due_date
        };
    }

    //Block Customer Card
    async updateCardStatus(card_id, status) {
        const card = await CreditCard.findOne({ where: { card_id } });

        if (!card) {
            throw new Error("Credit card not found");
        }

        // Block any action on already closed card
        if (card.status === 'closed') {
            throw new Error("Cannot modify card: Card is permanently closed");
        }

        // Block if already in requested status
        if (card.status === status) {
            throw new Error(`Card is already ${status}`);
        }

        card.status = status; // e.g., 'blocked'
        await card.save();

        return {
            card_id: card.card_id,
            new_status: card.status
        };
    }
}

module.exports = new CreditCardService();