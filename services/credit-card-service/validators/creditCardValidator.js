/**
 * /services/credit-card-service/validators/creditCardValidator.js
 * Validates credit card application and payment requests for PostgreSQL.
 */
// Fixed path (needs 3 levels up: ../../../):
const responseFormatter = require('../../../shared/utils/responseFormatter');
const validateCreditCardInput = (data, type) => {
    const errors = [];

    if (type === 'application') { 
        // 1. Credit Limit Validation: Within policy bounds 
        if (!data.requested_limit || data.requested_limit <= 0) {
            errors.push("Requested limit must be a positive number."); 
        }
        
        // 2. Income Validation: Must meet minimum threshold 
        if (!data.annual_income || data.annual_income < 300000) {
            errors.push("Income threshold not met."); 
        }
        
        // 3. Employment Type Validation: Required for risk category 
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

    // Standardized Success/Failure Output
    return {
        valid: errors.length === 0,
        errors: errors
    }; 
};

module.exports = { validateCreditCardInput };