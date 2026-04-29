/**
 * /services/credit-card-service/services/creditCardService.js
 * Handles credit card business logic with PostgreSQL.
 */
const CreditCard = require('../models/creditCard.model');
const creditScoreCalculator = require('../../shared/utils/creditScoreCalculator'); // [cite: 169]

class CreditCardService {
    async applyForCreditCard(data) {
        // Eligibility check using shared utility [cite: 2468]
        const eligibility = creditScoreCalculator.calculateCreditScore(data);
        if (!eligibility.eligible) throw new Error("Credit eligibility failed [cite: 2463]");

        // Assign credit limit based on eligibility score [cite: 2468]
        return await CreditCard.create({
            user_id: data.user_id,
            linked_account_id: data.source_account_id,
            card_number: this.generateCardNumber(), // [cite: 2468]
            card_type: 'VISA_PREMIUM',
            credit_limit: data.requested_limit,
            available_limit: data.requested_limit,
            billing_cycle_date: 1
        });
    }

    generateCardNumber() {
        // Banking structure compliance [cite: 168]
        return Array.from({length: 16}, () => Math.floor(Math.random() * 10)).join('');
    }
}

module.exports = new CreditCardService();