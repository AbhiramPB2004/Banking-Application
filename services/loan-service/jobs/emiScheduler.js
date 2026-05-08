// /services/loan-service/jobs/emiScheduler.js

const cron = require("node-cron");
const { Loan, EMISchedule } = require("../models/loan.model");
const { Op } = require("sequelize");

/**
 * EMI Scheduler Job
 * Runs daily at midnight to:
 * - Update next_due_date on active loans
 * - Mark overdue installments
 */

async function processEMIDueDates() {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Find overdue EMIs (past due date, still upcoming)
    const [overdueCount] = await EMISchedule.update(
      { status: "overdue" },
      {
        where: {
          status: "upcoming",
          due_date: { [Op.lt]: today },
        },
      }
    );

    if (overdueCount > 0) {
      console.log(`[EMI Scheduler] Marked ${overdueCount} EMIs as overdue.`);
    }

    // Update next_due_date for active loans
    const activeLoans = await Loan.findAll({
      where: { loan_status: "active", approval_status: "approved" },
    });

    for (const loan of activeLoans) {
      const nextEMI = await EMISchedule.findOne({
        where: { loan_id: loan.loan_id, status: ["upcoming", "overdue"] },
        order: [["installment_number", "ASC"]],
      });

      if (nextEMI && loan.next_due_date !== nextEMI.due_date) {
        loan.next_due_date = nextEMI.due_date;
        await loan.save();
      }
    }

    console.log(`[EMI Scheduler] Processed ${activeLoans.length} active loans.`);
  } catch (error) {
    console.error("[EMI Scheduler] Error:", error.message);
  }
}

/**
 * Start the EMI scheduler cron job
 * Runs daily at 00:00 (midnight)
 */
function startEMIScheduler() {
  cron.schedule("0 0 * * *", () => {
    console.log("[EMI Scheduler] Running daily EMI check...");
    processEMIDueDates();
  });

  console.log("[EMI Scheduler] Cron job registered (daily at midnight).");
}

module.exports = {
  startEMIScheduler,
  processEMIDueDates,
};
