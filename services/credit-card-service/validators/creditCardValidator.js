/**
 * /services/credit-card-service/validators/creditCardValidator.js
 * Validates credit card application and payment requests for PostgreSQL.
 */
// Fixed path (needs 3 levels up: ../../../):
const responseFormatter = require('../../../shared/utils/responseFormatter');
const validateCreditCardInput = (data, type) => {
    const errors = [];

    if (type === 'application') {
        // 1. Credit Limit Validation
        if (!data.requested_limit || data.requested_limit <= 0) {
            errors.push("Requested limit must be a positive number.");
        }

        // 2. Card Tier Validation
        const validTiers = ['entry', 'premium'];
        if (data.card_tier && !validTiers.includes(data.card_tier)) {
            errors.push("card_tier must be 'entry' or 'premium'.");
        }

        // 3. Income Validation: tier-aware thresholds
        const tier = data.card_tier || 'entry';
        const incomeMap = { entry: 300000, premium: 1000000 };
        const minIncome = incomeMap[tier];
        if (!data.annual_income || data.annual_income < minIncome) {
            errors.push(`Income threshold not met. Minimum for ${tier} card: ₹${(minIncome/100000).toFixed(0)} Lakhs.`);
        }

        // 4. Employment Type Validation
        if (!data.employment_type || typeof data.employment_type !== 'string') {
            errors.push("Invalid or missing employment type.");
        }
    }

    if (type === 'payment') { 
        // 1. Target Card Identification: Required for cardholder mapping 
        if (!data.card_id) {
            errors.push("Card ID is required."); 
        }
        
        // 2. Amount Validation: Must be a positive numeric value 
        if (!data.payment_amount || data.payment_amount <= 0) {
            errors.push("Payment amount must be positive."); 
        }
        
        // 3. Source Account: Validation of payment bank account 
        if (!data.source_account_id) {
            errors.push("Source bank account is required."); 
        }
    }

    if (type === 'purchase') {
        // 1. Amount: Must be positive
        if (!data.amount || data.amount <= 0) {
            errors.push("Transaction amount must be positive.");
        }

        // 2. Merchant: Required for tracking
        if (!data.merchant || typeof data.merchant !== 'string') {
            errors.push("Merchant name is required.");
        }
    }

    // Standardized Success/Failure Output
    return {
        valid: errors.length === 0,
        errors: errors
    }; 
};

module.exports = { validateCreditCardInput };