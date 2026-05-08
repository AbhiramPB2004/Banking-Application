// /shared/utils/emiCalculator.js

/**
 * EMI Calculator Utility
 * Uses Reducing Balance Method (Indian banking standard)
 *
 * Formula: EMI = P × r × (1+r)^n / ((1+r)^n - 1)
 * Where:
 *   P = Principal amount
 *   r = Monthly interest rate (annual / 12 / 100)
 *   n = Tenure in months
 */

/**
 * Calculate monthly EMI
 * @param {number} principal - Loan principal amount
 * @param {number} annualRate - Annual interest rate (e.g., 12 for 12%)
 * @param {number} tenureMonths - Loan tenure in months
 * @returns {number} Monthly EMI amount (rounded to 2 decimals)
 */
function calculateEMI(principal, annualRate, tenureMonths) {
  if (principal <= 0 || annualRate <= 0 || tenureMonths <= 0) {
    throw new Error("Principal, interest rate, and tenure must be positive.");
  }

  const monthlyRate = annualRate / 12 / 100;
  const compoundFactor = Math.pow(1 + monthlyRate, tenureMonths);

  const emi = (principal * monthlyRate * compoundFactor) / (compoundFactor - 1);

  return parseFloat(emi.toFixed(2));
}

/**
 * Generate full amortization schedule
 * @param {number} principal - Loan principal
 * @param {number} annualRate - Annual interest rate
 * @param {number} tenureMonths - Tenure in months
 * @param {Date} startDate - Loan start date
 * @returns {Array} Schedule array with per-installment breakdown
 */
function generateAmortizationSchedule(
  principal,
  annualRate,
  tenureMonths,
  startDate
) {
  const emi = calculateEMI(principal, annualRate, tenureMonths);
  const monthlyRate = annualRate / 12 / 100;

  const schedule = [];
  // Use full float precision for running balance — only round at output
  let outstanding = principal;
  let currentDate = new Date(startDate);

  for (let i = 1; i <= tenureMonths; i++) {
    currentDate = new Date(currentDate);
    currentDate.setMonth(currentDate.getMonth() + 1);

    // Keep interest in full precision to avoid compounding rounding drift
    const interestRaw = outstanding * monthlyRate;
    const interestComponent = parseFloat(interestRaw.toFixed(2));

    let principalComponent;
    let emiAmount;

    if (i === tenureMonths) {
      // Last installment: clear whatever remains exactly.
      // Do NOT use a rounded intermediate — use the live outstanding value
      // so the final EMI matches what the user actually needs to pay.
      principalComponent = parseFloat(outstanding.toFixed(2));
      emiAmount = parseFloat((principalComponent + interestComponent).toFixed(2));
      outstanding = 0;
    } else {
      principalComponent = parseFloat((emi - interestComponent).toFixed(2));
      outstanding = outstanding - principalComponent;
      // Clamp floating-point noise (e.g. -0.0000001 after many iterations)
      if (outstanding < 0) outstanding = 0;
      emiAmount = emi;
    }

    schedule.push({
      installment_number: i,
      due_date: currentDate.toISOString().split("T")[0],
      emi_amount: emiAmount,
      principal_component: principalComponent,
      interest_component: interestComponent,
      outstanding_after: parseFloat(outstanding.toFixed(2)),
    });
  }

  return schedule;
}


/**
 * Calculate foreclosure penalty
 * @param {number} outstandingBalance - Current outstanding balance
 * @param {number} penaltyRate - Penalty rate (e.g., 4 for 4%)
 * @returns {object} Foreclosure breakdown
 */
function calculateForeclosurePenalty(outstandingBalance, penaltyRate = 4) {
  const penalty = parseFloat(
    ((outstandingBalance * penaltyRate) / 100).toFixed(2)
  );

  const totalPayable = parseFloat(
    (outstandingBalance + penalty).toFixed(2)
  );

  return {
    outstanding_balance: outstandingBalance,
    penalty_rate: penaltyRate,
    penalty_amount: penalty,
    total_foreclosure_amount: totalPayable,
  };
}

/**
 * Calculate total payable amount over full tenure
 * @param {number} emi - Monthly EMI
 * @param {number} tenureMonths - Tenure in months
 * @returns {number} Total repayment amount
 */
function calculateTotalPayable(emi, tenureMonths) {
  return parseFloat((emi * tenureMonths).toFixed(2));
}

module.exports = {
  calculateEMI,
  generateAmortizationSchedule,
  calculateForeclosurePenalty,
  calculateTotalPayable,
};
