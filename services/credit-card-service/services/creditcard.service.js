/**
 * /services/credit-card-service/services/creditcard.service.js
 * Handles credit card business logic with PostgreSQL.
 */
const CreditCard = require('../models/creditcard.model');
const creditScoreCalculator = require('../utils/creditScoreCalculator');
const accountService = require('../../../services/account-service/services/accountService');
const Account = require('../../account-service/models/account.model');
const paymentTrackingService = require("../../payment-tracking-service/services/paymentTracking.service");

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
    let finalLimit = systemLimit;

    if (requested > 0) {
        if (requested > systemLimit) {
            throw new Error(
                `Requested limit exceeds your eligible limit of ₹${Math.floor(systemLimit).toLocaleString('en-IN')}`
            );
        }
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
        billing_cycle_date: today.getDate(),
        due_date: firstDueDate.toISOString().split('T')[0],
        last_billing_date: today.toISOString().split('T')[0],
        interest_rate: 0.0360,
        penalty_rate: 0.0200,
        penalty_applied: false
    });
}

    generateCardNumber() {
        return Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('');
    }

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
        const { card_id, user_id, amount, merchant_name, category, description } = data;

        // 1. Fetch the card and verify ownership
        const card = await CreditCard.findOne({ where: { card_id, user_id } });
        if (!card) {
            throw new Error("Credit card not found or unauthorized");
        }

        if (card.status !== 'active') {
            throw new Error("Cannot process transaction: Card is not active");
        }

        const transactionAmount = parseFloat(amount);
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
        await card.save();

        // 5. Track the purchase
        try {
            await paymentTrackingService.createPaymentRecord({
                user_id: user_id,
                payment_type: "CREDIT_CARD",
                transaction_type: "PURCHASE",
                merchant_name: merchant_name || "Online Merchant",
                category: category || "Shopping",
                amount: transactionAmount,
                status: "SUCCESS",
                payment_method: "CARD",
                reference_id: `CARD-PUR-${card_id}-${Date.now()}`,
                related_entity_id: card_id.toString(),
                description: description || `Credit Card purchase at ${merchant_name || 'Merchant'}`,
            });
        } catch (trackError) {
            console.error("Purchase tracking failed:", trackError.message);
        }

        return {
            card_id: card.card_id,
            transaction_amount: transactionAmount,
            remaining_limit: card.available_limit,
            outstanding_balance: card.outstanding_balance
        };
    }

    // Retrieves card details safely
    async getCardById(card_id, user_id) {
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

        if (card.status === 'closed') {
            throw new Error("Cannot process payment: Card is permanently closed");
        }

        const payment = parseFloat(payment_amount);
        const previousBalance = parseFloat(card.outstanding_balance);
        const hadPenaltyBefore = card.penalty_applied === true;

        if (payment <= 0) {
            throw new Error("Payment amount must be greater than zero");
        }

        if (previousBalance <= 0) {
            throw new Error("No outstanding balance to repay on this card");
        }

        if (payment > previousBalance) {
            throw new Error(`Payment amount ₹${payment} exceeds outstanding balance ₹${previousBalance.toFixed(2)}`);
        }

        // Math: Reduce balance, restore available limit
        card.outstanding_balance = previousBalance - payment;
        card.available_limit = parseFloat(card.available_limit) + payment;

        if (card.outstanding_balance <= 0) {
            card.outstanding_balance = 0;
            card.available_limit = parseFloat(card.credit_limit);
            card.penalty_applied = false;
            card.minimum_due = 0;
            const nextDue = new Date();
            nextDue.setDate(nextDue.getDate() + 30);
            card.due_date = nextDue.toISOString().split('T')[0];
        } else {
            const creditLimit = parseFloat(card.credit_limit);
            if (card.available_limit > creditLimit) {
                card.available_limit = creditLimit;
            }

            const currentMinDue = parseFloat(card.minimum_due);
            if (payment >= currentMinDue) {
                card.minimum_due = 0;
            } else {
                card.minimum_due = Math.max(0, currentMinDue - payment);
            }
        }

        await card.save();

        // ── Track Repayment ────────────────────────────────────────────────
        try {
            await paymentTrackingService.createPaymentRecord({
                user_id: user_id,
                payment_type: "CREDIT_CARD",
                transaction_type: "PAYMENT",
                merchant_name: "Self Repayment",
                category: "Finance",
                amount: payment,
                status: "SUCCESS",
                payment_method: "BANK_TRANSFER",
                reference_id: `CARD-PAY-${card_id}-${Date.now()}`,
                related_entity_id: card_id.toString(),
                description: `Credit Card Repayment for Card ending in ${card.card_number.slice(-4)}`,
            });
        } catch (trackError) {
            console.error("Payment tracking failed:", trackError.message);
        }

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

    async updateCardStatus(card_id, user_id, status) {
        const card = await CreditCard.findOne({ where: { card_id, user_id } });
        if (!card) {
            throw new Error("Credit card not found or unauthorized access");
        }
        if (card.status === 'closed') {
            throw new Error("Cannot modify card: Card is permanently closed");
        }
        if (status === 'closed') {
            throw new Error("Use the dedicated close endpoint to close a card");
        }
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

    async closeCard(card_id, user_id) {
        const card = await CreditCard.findOne({ where: { card_id, user_id } });
        if (!card) {
            throw new Error("Credit card not found or unauthorized access");
        }
        if (card.status === 'closed') {
            throw new Error("Card is already permanently closed");
        }
        const outstanding = parseFloat(card.outstanding_balance);
        if (outstanding > 0) {
            throw new Error(
                `Cannot close card: You have an outstanding balance of ₹${outstanding.toLocaleString('en-IN')}. Please clear all dues before closing.`
            );
        }
        const minimumDue = parseFloat(card.minimum_due);
        if (minimumDue > 0) {
            throw new Error(
                `Cannot close card: You have a minimum due of ₹${minimumDue.toLocaleString('en-IN')} pending. Please pay it before closing.`
            );
        }
        if (card.penalty_applied === true) {
            throw new Error(
                "Cannot close card: A late-payment penalty is currently applied on this card. Please repay the outstanding balance first."
            );
        }

        card.status = 'closed';
        card.available_limit = 0;
        await card.save();

        return {
            card_id: card.card_id,
            new_status: 'closed',
            message: "Your credit card has been permanently closed. No further transactions will be allowed."
        };
    }

    async deleteCard(card_id, user_id) {
        const card = await CreditCard.findOne({ where: { card_id, user_id } });
        if (!card) {
            throw new Error("Credit card not found or unauthorized access");
        }
        if (card.status !== 'closed') {
            throw new Error("Card must be closed before it can be deleted. Please close the card first.");
        }
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

    // Generate a detailed statement with transaction history
    async getCardStatement(card_id, user_id) {
        const card = await CreditCard.findOne({ where: { card_id, user_id } });

        if (!card) {
            throw new Error("Credit card not found or unauthorized access");
        }

        // Fetch transactions related to this card from payment tracking
        const transactionData = await paymentTrackingService.getUserPayments(user_id, {
            related_entity_id: card_id.toString(),
            payment_type: "CREDIT_CARD",
            status: "SUCCESS"
        }, { limit: 100 });

        return {
            card_id: card.card_id,
            card_number: this.maskCardNumber(card.card_number),
            statement_date: new Date().toISOString().split('T')[0],
            outstanding_balance: parseFloat(card.outstanding_balance),
            available_limit: parseFloat(card.available_limit),
            total_limit: parseFloat(card.credit_limit),
            minimum_due: parseFloat(card.minimum_due),
            due_date: card.due_date,
            billing_cycle_date: card.billing_cycle_date,
            status: card.status,
            transactions: transactionData.payments || [],
            message: "Monthly statement summary compiled successfully"
        };
    }

    maskCardNumber(cardNumber) {
        if (!cardNumber || cardNumber.length < 4) return cardNumber;
        return "**** **** **** " + cardNumber.slice(-4);
    }
}

module.exports = new CreditCardService();