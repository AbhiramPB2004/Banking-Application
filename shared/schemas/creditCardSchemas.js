/**
 * /shared/schemas/creditCardSchemas.js
 * Centralized validation contracts for Credit Card operations.
 */

const creditCardApplicationSchema = {
    // Identity linked via req.user.user_id, but profile must be provided
    requested_limit: {
        type: "number",
        required: true,
        min: 10000 // Platform-wide minimum [cite: 2461]
    },
    annual_income: {
        type: "number",
        required: true,
        min: 0 // Must be a positive numeric value [cite: 2461]
    },
    employment_type: {
        type: "string",
        required: true,
        enum: ["salaried", "self-employed", "business"] // [cite: 2461]
    }
};

const creditCardPaymentSchema = {
    card_id: {
        type: "string", // UUID format
        required: true
    },
    payment_amount: {
        type: "number",
        required: true,
        min: 1 // Must be positive [cite: 2462]
    },
    source_account_id: {
        type: "string", // Bank account to debit [cite: 2462]
        required: true
    }
};

module.exports = {
    creditCardApplicationSchema,
    creditCardPaymentSchema
};