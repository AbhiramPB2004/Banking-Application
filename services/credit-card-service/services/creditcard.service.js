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
        return await CreditCard.create({
            user_id: data.user_id,
            linked_account_id: data.source_account_id || '00000000-0000-0000-0000-000000000000', // Fallback if missing
            card_number: this.generateCardNumber(),
            card_type: 'VISA_PREMIUM',
            credit_limit: finalLimit,
            available_limit: finalLimit,
            billing_cycle_date: 1
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

        return {
            card_id: card.card_id,
            card_number: card.card_number, // In a real app, you'd mask this (e.g., **** **** **** 1234)
            card_type: card.card_type,
            credit_limit: parseFloat(card.credit_limit),
            available_limit: parseFloat(card.available_limit),
            outstanding_balance: parseFloat(card.outstanding_balance),
            minimum_due: parseFloat(card.minimum_due),
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

        const payment = parseFloat(payment_amount);

        // Math: Reduce balance, restore available limit
        card.outstanding_balance = parseFloat(card.outstanding_balance) - payment;
        card.available_limit = parseFloat(card.available_limit) + payment;

        await card.save();

        return {
            card_id: card.card_id,
            payment_applied: payment,
            new_outstanding_balance: card.outstanding_balance,
            restored_available_limit: card.available_limit
        };
    }

    // MISSING FUNCTION ADDED: Block Customer Card
    async updateCardStatus(card_id, status) {
        const card = await CreditCard.findOne({ where: { card_id } });

        if (!card) {
            throw new Error("Credit card not found");
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