// /services/loan-service/jobs/repaymentTracker.js

const cron = require("node-cron");
const { Loan, EMISchedule } = require("../models/loan.model");
const { Op } = require("sequelize");

/**
 * Repayment Tracker Job
 * Runs daily to:
 * - Scan for missed payments
 * - Track consecutive misses
 * - Escalate to defaulted after 3+ missed EMIs
 */

async function trackRepayments() {
  try {
    const activeLoans = await Loan.findAll({
      where: { loan_status: "active", approval_status: "approved" },
    });

    let delinquentCount = 0;
    let defaultedCount = 0;

    for (const loan of activeLoans) {
      const overdueEMIs = await EMISchedule.count({
        where: { loan_id: loan.loan_id, status: "overdue" },
      });

      if (overdueEMIs >= 3) {
        loan.loan_status = "defaulted";
        await loan.save();
        defaultedCount++;
        console.log(`[Repayment Tracker] Loan ${loan.loan_id} marked as DEFAULTED (${overdueEMIs} overdue EMIs).`);
      } else if (overdueEMIs > 0) {
        delinquentCount++;
      }
    }

    console.log(`[Repayment Tracker] Processed ${activeLoans.length} loans. Delinquent: ${delinquentCount}, Defaulted: ${defaultedCount}.`);
  } catch (error) {
    console.error("[Repayment Tracker] Error:", error.message);
  }
}

/**
 * Start the repayment tracker cron job
 * Runs daily at 01:00 (1 AM)
 */
function startRepaymentTracker() {
  cron.schedule("0 1 * * *", () => {
    console.log("[Repayment Tracker] Running daily repayment scan...");
    trackRepayments();
  });

  console.log("[Repayment Tracker] Cron job registered (daily at 1 AM).");
}

module.exports = {
  startRepaymentTracker,
  trackRepayments,
};
