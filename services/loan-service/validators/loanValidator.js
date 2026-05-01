// /services/loan-service/validators/loanValidator.js

const {
  SUPPORTED_LOAN_TYPES,
  getProductConfig,
  MIN_ANNUAL_INCOME,
} = require("../../../shared/config/loanProducts");

/**
 * Validate Loan Application Input
 * Follows the accountValidator.js pattern
 *
 * @param {object} data - Application data
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateLoanApplication(data) {
  const errors = [];

  // --- Loan Type ---
  if (!data.loan_type) {
    errors.push("Loan type is required.");
  } else if (!SUPPORTED_LOAN_TYPES.includes(data.loan_type)) {
    errors.push(
      `Invalid loan type. Supported types: ${SUPPORTED_LOAN_TYPES.join(", ")}.`
    );
  }

  // --- Requested Amount ---
  if (!data.requested_amount || data.requested_amount <= 0) {
    errors.push("Requested amount must be a positive number.");
  } else if (data.loan_type && SUPPORTED_LOAN_TYPES.includes(data.loan_type)) {
    const product = getProductConfig(data.loan_type);

    if (data.requested_amount < product.min_amount) {
      errors.push(
        `Minimum loan amount for ${product.name} is ₹${product.min_amount.toLocaleString("en-IN")}.`
      );
    }

    if (data.requested_amount > product.max_amount) {
      errors.push(
        `Maximum loan amount for ${product.name} is ₹${product.max_amount.toLocaleString("en-IN")}.`
      );
    }
  }

  // --- Tenure ---
  if (!data.tenure_months || data.tenure_months <= 0) {
    errors.push("Tenure (in months) must be a positive number.");
  } else if (
    data.loan_type &&
    SUPPORTED_LOAN_TYPES.includes(data.loan_type)
  ) {
    const product = getProductConfig(data.loan_type);

    if (data.tenure_months < product.min_tenure) {
      errors.push(
        `Minimum tenure for ${product.name} is ${product.min_tenure} months.`
      );
    }

    if (data.tenure_months > product.max_tenure) {
      errors.push(
        `Maximum tenure for ${product.name} is ${product.max_tenure} months.`
      );
    }
  }

  // --- Annual Income ---
  if (!data.annual_income || data.annual_income <= 0) {
    errors.push("Annual income must be a positive number.");
  } else if (data.annual_income < MIN_ANNUAL_INCOME) {
    errors.push(
      `Minimum annual income required is ₹${MIN_ANNUAL_INCOME.toLocaleString("en-IN")}.`
    );
  }

  // --- Existing Liabilities ---
  if (data.existing_liabilities === undefined || data.existing_liabilities === null) {
    errors.push("Existing liabilities amount is required.");
  } else if (data.existing_liabilities < 0) {
    errors.push("Existing liabilities cannot be negative.");
  }

  // --- Linked Account ---
  if (!data.linked_account_id) {
    errors.push("Linked account ID is required for disbursal.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Repayment Input
 *
 * @param {object} data - Repayment data
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateRepaymentInput(data) {
  const errors = [];

  if (!data.loan_id) {
    errors.push("Loan ID is required.");
  }

  if (!data.payment_amount || data.payment_amount <= 0) {
    errors.push("Payment amount must be a positive number.");
  }

  if (!data.source_account_id) {
    errors.push("Source account ID is required.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Foreclosure Input
 *
 * @param {object} data - Foreclosure data
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateForeclosureInput(data) {
  const errors = [];

  if (!data.loan_id) {
    errors.push("Loan ID is required.");
  }

  if (!data.source_account_id) {
    errors.push("Source account ID is required for foreclosure payment.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateLoanApplication,
  validateRepaymentInput,
  validateForeclosureInput,
};
