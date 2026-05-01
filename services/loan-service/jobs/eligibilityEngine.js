// /services/loan-service/jobs/eligibilityEngine.js

const { Loan } = require("../models/loan.model");
const User = require("../../user-service/models/user.model");
const { calculateCreditScore, determineRiskCategory } = require("../../../shared/utils/creditScoreCalculator");

/**
 * Eligibility Engine
 * Batch processing utility for:
 * - Pre-computing eligibility for pending applications
 * - Recalculating credit scores for active loans
 * - Flagging high-risk accounts
 */

/**
 * Recalculate credit scores for all active loans
 * Useful for periodic risk reassessment
 */
async function recalculateCreditScores() {
  try {
    const activeLoans = await Loan.findAll({
      where: { loan_status: "active", approval_status: "approved" },
    });

    let updatedCount = 0;
    let highRiskCount = 0;

    for (const loan of activeLoans) {
      const user = await User.findByPk(loan.user_id);
      if (!user) continue;

      const newScore = calculateCreditScore({
        annual_income: parseFloat(user.annual_income),
        existing_liabilities: 0, // Would need real-time liability data
        occupation: user.occupation,
      });

      const newRisk = determineRiskCategory(newScore);

      if (loan.credit_score !== newScore || loan.risk_category !== newRisk) {
        loan.credit_score = newScore;
        loan.risk_category = newRisk;
        await loan.save();
        updatedCount++;
      }

      if (newRisk === "high" || newRisk === "very_high") {
        highRiskCount++;
      }
    }

    console.log(
      `[Eligibility Engine] Updated ${updatedCount}/${activeLoans.length} scores. High-risk: ${highRiskCount}.`
    );

    return { total: activeLoans.length, updated: updatedCount, high_risk: highRiskCount };
  } catch (error) {
    console.error("[Eligibility Engine] Error:", error.message);
    throw error;
  }
}

/**
 * Get risk summary across all active loans
 */
async function getRiskSummary() {
  try {
    const activeLoans = await Loan.findAll({
      where: { loan_status: "active" },
      attributes: ["loan_id", "user_id", "loan_type", "outstanding_balance", "credit_score", "risk_category"],
    });

    const summary = { low: 0, medium: 0, high: 0, very_high: 0 };

    for (const loan of activeLoans) {
      const category = loan.risk_category || "medium";
      if (summary[category] !== undefined) summary[category]++;
    }

    return { total_active: activeLoans.length, risk_distribution: summary };
  } catch (error) {
    console.error("[Eligibility Engine] Risk summary error:", error.message);
    throw error;
  }
}

module.exports = {
  recalculateCreditScores,
  getRiskSummary,
};
