// /shared/config/loanProducts.js

/**
 * Loan Product Configuration
 * Defines supported loan types with their parameters
 *
 * All amounts in INR (₹)
 * Interest rates are annual (p.a.)
 * Tenure in months
 */

const LOAN_PRODUCTS = {
  personal: {
    name: "Personal Loan",
    interest_rate: 12.0,
    min_amount: 50000,
    max_amount: 2000000,
    min_tenure: 6,
    max_tenure: 60,
    foreclosure_penalty_rate: 4,      // % of outstanding balance
    prepayment_penalty_rate: 2,       // % of prepaid principal (bulk EMI)
    min_credit_score: 650,
    description: "Unsecured personal loan for any purpose",
  },

  home: {
    name: "Home Loan",
    interest_rate: 8.5,
    min_amount: 500000,
    max_amount: 20000000,
    min_tenure: 12,
    max_tenure: 360,
    foreclosure_penalty_rate: 2,
    prepayment_penalty_rate: 1,
    min_credit_score: 700,
    description: "Secured home purchase / construction loan",
  },

  vehicle: {
    name: "Vehicle Loan",
    interest_rate: 9.5,
    min_amount: 100000,
    max_amount: 5000000,
    min_tenure: 12,
    max_tenure: 84,
    foreclosure_penalty_rate: 3,
    prepayment_penalty_rate: 2,
    min_credit_score: 650,
    description: "New or used vehicle purchase loan",
  },

  education: {
    name: "Education Loan",
    interest_rate: 7.5,
    min_amount: 100000,
    max_amount: 7500000,
    min_tenure: 12,
    max_tenure: 120,
    foreclosure_penalty_rate: 1,
    prepayment_penalty_rate: 0.5,
    min_credit_score: 600,
    description: "Higher education funding loan",
  },
};

/**
 * Supported loan type keys
 */
const SUPPORTED_LOAN_TYPES = Object.keys(LOAN_PRODUCTS);

/**
 * Get product config by loan type
 * @param {string} loanType
 * @returns {object|null} Product config or null
 */
function getProductConfig(loanType) {
  return LOAN_PRODUCTS[loanType] || null;
}

/**
 * Minimum income required for loan eligibility
 */
const MIN_ANNUAL_INCOME = 100000; // ₹1,00,000

/**
 * Maximum debt-to-income ratio allowed
 */
const MAX_DTI_RATIO = 0.5; // 50%

/**
 * Minimum credit score for any loan
 */
const MIN_CREDIT_SCORE_GLOBAL = 500;

module.exports = {
  LOAN_PRODUCTS,
  SUPPORTED_LOAN_TYPES,
  getProductConfig,
  MIN_ANNUAL_INCOME,
  MAX_DTI_RATIO,
  MIN_CREDIT_SCORE_GLOBAL,
};
