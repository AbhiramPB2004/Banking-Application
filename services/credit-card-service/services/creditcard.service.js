/**
 * /services/credit-card-service/services/creditcard.service.js
 * Handles credit card business logic with PostgreSQL.
 */
const CreditCard = require('../models/creditcard.model');
const creditScoreCalculator = require('../utils/creditScoreCalculator');
const accountService = require('../../../services/account-service/services/accountService');
const Account = require('../../account-service/models/account.model');
class CreditCardService {
    async applyForCreditCard(data) {
    // 1. Eligibility check
    const eligibility = creditScoreCalculator.calculateCreditScore(data);

    if (!eligibility.eligible) {
        throw new Error("Credit eligibility failed");
    }

    // 2. Validate account ownership
    const account = await Account.findOne({
        where: {
            account_id: data.source_account_id,
            user_id: data.user_id,
            status: "active"
        }
    });

    if (!account) {
        throw new Error("Invalid or unauthorized account");
    }

        // 3. Extract financial inputs
        
    const income = parseFloat(data.annual_income);
    const liabilities = parseFloat(data.existing_liabilities || 0);
    const requested = parseFloat(data.requested_limit || 0);

    // 4. Base calculation (income-driven)
    let calculatedLimit = income * 0.2;

    // 5. Liability adjustment
    const monthlyIncome = income / 12;
    const dti = liabilities / monthlyIncome;

    if (dti > 0.5) calculatedLimit *= 0.5;
    else if (dti > 0.3) calculatedLimit *= 0.7;

    // 6. Score multiplier
    if (eligibility.category === "EXCELLENT") {
        calculatedLimit *= 1.5;
    } else if (eligibility.category === "GOOD") {
        calculatedLimit *= 1.2;
    }

    // 7. Safety cap (optional: based on account balance)
    const balanceCap = parseFloat(account.balance) * 0.5;

    // 8. Final system limit
    let systemLimit = Math.min(calculatedLimit, balanceCap);

    // 9. Enforce minimum
    const MIN_LIMIT = 10000;
    if (systemLimit < MIN_LIMIT) {
        throw new Error("User not eligible for minimum credit limit");
    }

    // 10. Final limit
    // Bug fix: if the user requested a specific amount, honour it as the cap.
    // Previously, finalLimit always defaulted to systemLimit, ignoring the user's request.
    let finalLimit = systemLimit;

    if (requested > 0) {
        if (requested > systemLimit) {
            throw new Error(
                `Requested limit exceeds your eligible limit of ₹${Math.floor(systemLimit).toLocaleString('en-IN')}`
            );
        }
        // Apply user's requested cap — they may want less than the max
        finalLimit = requested;
    }

    // 11. Dates
    const firstDueDate = new Date();
    firstDueDate.setDate(firstDueDate.getDate() + 20);

    const today = new Date();

    // 12. Create card
    const uniqueCardNumber = await this.generateUniqueCardNumber();

    return await CreditCard.create({
        user_id: data.user_id,
        linked_account_id: data.source_account_id,
        card_number: uniqueCardNumber,
        card_type: data.card_tier === "premium" ? "VISA_PREMIUM" : "VISA_CLASSIC",
        credit_limit: finalLimit,
        available_limit: finalLimit,
        // Use actual day-of-month so billing aligns to the card's issue date
        billing_cycle_date: today.getDate(),
        due_date: firstDueDate.toISOString().split('T')[0],
        last_billing_date: today.toISOString().split('T')[0],
        interest_rate: 0.0360,
        penalty_rate: 0.0200,
        penalty_applied: false
    });
}

    generateCardNumber() {
        // Banking structure compliance
        return Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('');
    }

    // Generates a card number that is guaranteed to be unique in the database
    async generateUniqueCardNumber(maxAttempts = 10) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const candidate = this.generateCardNumber();
            const existing = await CreditCard.findOne({ where: { card_number: candidate } });
            if (!existing) return candidate;
        }
        throw new Error('Failed to generate a unique card number after multiple attempts. Please retry.');
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
            card_number: this.maskCardNumber(card.card_number),
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

        // Guard: nothing to pay — avoids confusing "exceeds" error on zero-balance cards
        if (previousBalance <= 0) {
            throw new Error("No outstanding balance to repay on this card");
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
        } else {
            // Bug fix: cap available_limit at credit_limit.
            // Interest inflation can push outstanding_balance > credit_limit, so
            // available_limit += payment could theoretically overshoot credit_limit.
            const creditLimit = parseFloat(card.credit_limit);
            if (card.available_limit > creditLimit) {
                card.available_limit = creditLimit;
            }

            // Bug fix: reduce minimum_due when partial payment covers or exceeds it.
            // Previously minimum_due stayed stale after any partial payment.
            const currentMinDue = parseFloat(card.minimum_due);
            if (payment >= currentMinDue) {
                card.minimum_due = 0;
            } else {
                card.minimum_due = Math.max(0, currentMinDue - payment);
            }
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

    // Fetch all cards for a specific user
    async getCardsByUserId(user_id) {
        const cards = await CreditCard.findAll({
            where: { user_id }
        });

        // Map to return safe data for each card
        return cards.map(card => ({
            card_id: card.card_id,
            card_number: this.maskCardNumber(card.card_number),
            card_type: card.card_type,
            credit_limit: parseFloat(card.credit_limit),
            available_limit: parseFloat(card.available_limit),
            outstanding_balance: parseFloat(card.outstanding_balance),
            status: card.status,
            due_date: card.due_date
        }));
    }

    // Block / Unblock only (does NOT handle close — use closeCard() for that)
    async updateCardStatus(card_id, user_id, status) {
        // Enforce ownership check for status transitions
        const card = await CreditCard.findOne({ where: { card_id, user_id } });

        if (!card) {
            throw new Error("Credit card not found or unauthorized access");
        }

        // Block any action on already closed card
        if (card.status === 'closed') {
            throw new Error("Cannot modify card: Card is permanently closed");
        }

        // Prevent close via this method — closeCard() must be used instead
        if (status === 'closed') {
            throw new Error("Use the dedicated close endpoint to close a card");
        }

        // Block if already in requested status
        if (card.status === status) {
            throw new Error(`Card is already ${status}`);
        }

        card.status = status;
        await card.save();

        return {
            card_id: card.card_id,
            new_status: card.status
        };
    }

    /**
     * Close a credit card — soft-delete (status → 'closed').
     * Edge cases enforced:
     *  1. Card must exist and belong to the user.
     *  2. Card must not already be closed.
     *  3. Outstanding balance must be ZERO before closure is permitted.
     *  4. Any unpaid minimum_due also blocks closure.
     *  5. An unapplied penalty (penalty_applied = true) blocks closure.
     */
    async closeCard(card_id, user_id) {
        const card = await CreditCard.findOne({ where: { card_id, user_id } });

        if (!card) {
            throw new Error("Credit card not found or unauthorized access");
        }

        // 1. Already closed
        if (card.status === 'closed') {
            throw new Error("Card is already permanently closed");
        }

        // 2. Outstanding balance check
        const outstanding = parseFloat(card.outstanding_balance);
        if (outstanding > 0) {
            throw new Error(
                `Cannot close card: You have an outstanding balance of ₹${outstanding.toLocaleString('en-IN')}. Please clear all dues before closing.`
            );
        }

        // 3. Minimum due check
        const minimumDue = parseFloat(card.minimum_due);
        if (minimumDue > 0) {
            throw new Error(
                `Cannot close card: You have a minimum due of ₹${minimumDue.toLocaleString('en-IN')} pending. Please pay it before closing.`
            );
        }

        // 4. Penalty check
        if (card.penalty_applied === true) {
            throw new Error(
                "Cannot close card: A late-payment penalty is currently applied on this card. Please repay the outstanding balance first."
            );
        }

        // All checks passed — soft-close the card
        card.status = 'closed';
        card.available_limit = 0; // No further credit available
        await card.save();

        return {
            card_id: card.card_id,
            new_status: 'closed',
            message: "Your credit card has been permanently closed. No further transactions will be allowed."
        };
    }

    /**
     * Hard-delete a credit card record from the database.
     * This is a destructive operation and has strict guards:
     *  1. Card must exist and belong to the user.
     *  2. Card must be in 'closed' status (must close first).
     *  3. Outstanding balance must be zero.
     * This ensures no financial record is wiped while debt exists.
     */
    async deleteCard(card_id, user_id) {
        const card = await CreditCard.findOne({ where: { card_id, user_id } });

        if (!card) {
            throw new Error("Credit card not found or unauthorized access");
        }

        // 1. Must be closed before deletion
        if (card.status !== 'closed') {
            throw new Error(
                "Card must be closed before it can be deleted. Please close the card first."
            );
        }

        // 2. Final outstanding balance guard (belt-and-suspenders)
        const outstanding = parseFloat(card.outstanding_balance);
        if (outstanding > 0) {
            throw new Error(
                `Cannot delete card: Outstanding balance of ₹${outstanding.toLocaleString('en-IN')} must be cleared first.`
            );
        }

        await card.destroy();

        return {
            card_id,
            message: "Credit card record has been permanently deleted."
        };
    }

    // Generate a simple statement summary
    async getCardStatement(card_id, user_id) {
        const card = await CreditCard.findOne({ where: { card_id, user_id } });

        if (!card) {
            throw new Error("Credit card not found or unauthorized access");
        }

        return {
            card_id: card.card_id,
            card_number: this.maskCardNumber(card.card_number),
            statement_date: new Date().toISOString().split('T')[0],
            outstanding_balance: parseFloat(card.outstanding_balance),
            available_limit: parseFloat(card.available_limit),
            minimum_due: parseFloat(card.minimum_due),
            due_date: card.due_date,
            billing_cycle_date: card.billing_cycle_date,
            status: card.status,
            message: "Monthly statement summary compiled successfully"
        };
    }

    // Helper: Mask all but last 4 digits of card number
    maskCardNumber(cardNumber) {
        if (!cardNumber || cardNumber.length < 4) return cardNumber;
        return "**** **** **** " + cardNumber.slice(-4);
    }
}

module.exports = new CreditCardService();