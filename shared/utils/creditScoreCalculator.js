// /shared/utils/creditScoreCalculator.js

/**
 * Credit Score Calculator Utility
 * Simulated creditworthiness engine for loan eligibility evaluation
 *
 * Score Range: 300 — 900 (Indian CIBIL-style)
 *
 * Scoring Factors:
 * - Income level (30% weight)
 * - Debt-to-income ratio (30% weight)
 * - Existing liabilities (20% weight)
 * - Employment profile / occupation (20% weight)
 */

/**
 * Occupation tier mapping
 * Higher tier = more stable income expectation
 */
const OCCUPATION_TIERS = {
  // Tier 1 — High stability
  doctor: 1,
  engineer: 1,
  lawyer: 1,
  government: 1,
  professor: 1,
  chartered_accountant: 1,

  // Tier 2 — Good stability
  teacher: 2,
  manager: 2,
  banker: 2,
  it_professional: 2,
  corporate: 2,
  consultant: 2,

  // Tier 3 — Moderate stability
  business: 3,
  entrepreneur: 3,
  freelancer: 3,
  shopkeeper: 3,
  trader: 3,

  // Tier 4 — Variable stability
  farmer: 4,
  student: 4,
  retired: 4,
  homemaker: 4,
  other: 4,
};

/**
 * Calculate simulated credit score
 * @param {object} userData - User profile data
 * @param {number} userData.annual_income - Annual income
 * @param {number} userData.existing_liabilities - Monthly liabilities
 * @param {string} userData.occupation - Occupation category
 * @returns {number} Credit score (300–900)
 */
function calculateCreditScore({
  annual_income = 0,
  existing_liabilities = 0,
  occupation = "other",
}) {
  let score = 500; // Base score

  // --- Income Component (30% weight, max +180 points) ---
  const monthlyIncome = annual_income / 12;

  if (monthlyIncome >= 200000) score += 180;
  else if (monthlyIncome >= 100000) score += 150;
  else if (monthlyIncome >= 50000) score += 120;
  else if (monthlyIncome >= 25000) score += 80;
  else if (monthlyIncome >= 15000) score += 40;
  else score -= 50;

  // --- Debt-to-Income Ratio Component (30% weight, max +180 points) ---
  const monthlyLiabilities = existing_liabilities;
  const dtiRatio =
    monthlyIncome > 0 ? monthlyLiabilities / monthlyIncome : 1;

  if (dtiRatio <= 0.1) score += 180;
  else if (dtiRatio <= 0.2) score += 140;
  else if (dtiRatio <= 0.3) score += 100;
  else if (dtiRatio <= 0.4) score += 60;
  else if (dtiRatio <= 0.5) score += 20;
  else score -= 80;

  // --- Existing Liabilities Component (20% weight, max +120 points) ---
  if (existing_liabilities === 0) score += 120;
  else if (existing_liabilities <= 10000) score += 80;
  else if (existing_liabilities <= 30000) score += 40;
  else if (existing_liabilities <= 60000) score += 0;
  else score -= 60;

  // --- Occupation Component (20% weight, max +120 points) ---
  const occupationKey = occupation.toLowerCase().replace(/\s+/g, "_");
  const tier = OCCUPATION_TIERS[occupationKey] || 4;

  if (tier === 1) score += 120;
  else if (tier === 2) score += 80;
  else if (tier === 3) score += 40;
  else score += 0;

  // Clamp to valid range
  return Math.max(300, Math.min(900, Math.round(score)));
}

/**
 * Evaluate debt-to-income ratio
 * @param {number} annualIncome - Annual income
 * @param {number} existingLiabilities - Monthly existing liabilities
 * @param {number} requestedEMI - Requested new EMI
 * @returns {object} { ratio, acceptable }
 */
function evaluateDebtToIncomeRatio(
  annualIncome,
  existingLiabilities,
  requestedEMI
) {
  const monthlyIncome = annualIncome / 12;
  const totalMonthlyDebt = existingLiabilities + requestedEMI;

  const ratio =
    monthlyIncome > 0
      ? parseFloat((totalMonthlyDebt / monthlyIncome).toFixed(4))
      : 1;

  return {
    monthly_income: parseFloat(monthlyIncome.toFixed(2)),
    total_monthly_debt: totalMonthlyDebt,
    ratio,
    acceptable: ratio <= 0.5, // Max 50% DTI ratio
  };
}

/**
 * Determine risk category from credit score
 * @param {number} score - Credit score (300–900)
 * @returns {string} Risk category
 */
function determineRiskCategory(score) {
  if (score >= 750) return "low";
  if (score >= 650) return "medium";
  if (score >= 500) return "high";
  return "very_high";
}

/**
 * Calculate maximum eligible loan amount
 * @param {number} annualIncome - Annual income
 * @param {number} existingLiabilities - Monthly existing liabilities
 * @param {number} interestRate - Annual interest rate
 * @param {number} maxTenure - Maximum tenure in months
 * @returns {number} Max eligible principal
 */
function getMaxEligibleAmount(
  annualIncome,
  existingLiabilities,
  interestRate,
  maxTenure
) {
  const monthlyIncome = annualIncome / 12;

  // Max 50% of income can go to total EMIs
  const maxTotalEMI = monthlyIncome * 0.5;
  const availableEMI = maxTotalEMI - existingLiabilities;

  if (availableEMI <= 0) return 0;

  // Reverse EMI formula: P = EMI × ((1+r)^n - 1) / (r × (1+r)^n)
  const monthlyRate = interestRate / 12 / 100;
  const compoundFactor = Math.pow(1 + monthlyRate, maxTenure);

  const maxPrincipal =
    (availableEMI * (compoundFactor - 1)) /
    (monthlyRate * compoundFactor);

  return parseFloat(Math.floor(maxPrincipal).toFixed(2));
}

module.exports = {
  calculateCreditScore,
  evaluateDebtToIncomeRatio,
  determineRiskCategory,
  getMaxEligibleAmount,
  OCCUPATION_TIERS,
};
