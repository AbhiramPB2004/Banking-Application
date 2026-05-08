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
  const reqAmount = Number(data.requested_amount);
  if (data.requested_amount === undefined || data.requested_amount === null || data.requested_amount === "" || isNaN(reqAmount) || reqAmount <= 0) {
    errors.push("Requested amount must be a valid positive number.");
  } else if (data.loan_type && SUPPORTED_LOAN_TYPES.includes(data.loan_type)) {
    const product = getProductConfig(data.loan_type);

    if (reqAmount < product.min_amount) {
      errors.push(
        `Minimum loan amount for ${product.name} is ₹${product.min_amount.toLocaleString("en-IN")}.`
      );
    }

    if (reqAmount > product.max_amount) {
      errors.push(
        `Maximum loan amount for ${product.name} is ₹${product.max_amount.toLocaleString("en-IN")}.`
      );
    }
  }

  // --- Tenure ---
  const tenure = Number(data.tenure_months);
  if (data.tenure_months === undefined || data.tenure_months === null || data.tenure_months === "" || isNaN(tenure) || !Number.isInteger(tenure) || tenure <= 0) {
    errors.push("Tenure (in months) must be a valid positive integer.");
  } else if (
    data.loan_type &&
    SUPPORTED_LOAN_TYPES.includes(data.loan_type)
  ) {
    const product = getProductConfig(data.loan_type);

    if (tenure < product.min_tenure) {
      errors.push(
        `Minimum tenure for ${product.name} is ${product.min_tenure} months.`
      );
    }

    if (tenure > product.max_tenure) {
      errors.push(
        `Maximum tenure for ${product.name} is ${product.max_tenure} months.`
      );
    }
  }

  // --- Annual Income ---
  const income = Number(data.annual_income);
  if (data.annual_income === undefined || data.annual_income === null || data.annual_income === "" || isNaN(income) || income <= 0) {
    errors.push("Annual income must be a valid positive number.");
  } else if (income < MIN_ANNUAL_INCOME) {
    errors.push(
      `Minimum annual income required is ₹${MIN_ANNUAL_INCOME.toLocaleString("en-IN")}.`
    );
  }

  // --- Existing Liabilities ---
  if (data.existing_liabilities === undefined || data.existing_liabilities === null || data.existing_liabilities === "") {
    errors.push("Existing liabilities amount is required.");
  } else {
    const liab = Number(data.existing_liabilities);
    if (isNaN(liab) || liab < 0) {
      errors.push("Existing liabilities must be a valid non-negative number.");
    }
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

  if (data.payment_amount === undefined || data.payment_amount === null || data.payment_amount === "") {
    errors.push("Payment amount is required.");
  } else {
    const payment = Number(data.payment_amount);
    if (isNaN(payment) || payment <= 0) {
      errors.push("Payment amount must be a valid positive number.");
    }
  }

  if (!data.source_account_id) {
    errors.push("Source account ID is required.");
  }

  if (data.installments_to_pay !== undefined && data.installments_to_pay !== "") {
    const n = Number(data.installments_to_pay);
    if (isNaN(n) || !Number.isInteger(n) || n < 1 || n > 12) {
      errors.push("installments_to_pay must be a whole number between 1 and 12.");
    }
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
