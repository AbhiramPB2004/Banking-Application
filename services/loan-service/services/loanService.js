// /services/loan-service/services/loanService.js

const { Loan, EMISchedule, RepaymentHistory } = require("../models/loan.model");
const { sequelize } = require("../../../shared/config/db");
const User = require("../../user-service/models/user.model");
const accountService = require("../../account-service/services/accountService");
const auditService = require("../../audit-service/services/auditService");
const { calculateEMI, generateAmortizationSchedule, calculateForeclosurePenalty, calculateTotalPayable } = require("../../../shared/utils/emiCalculator");
const { calculateCreditScore, evaluateDebtToIncomeRatio, determineRiskCategory, getMaxEligibleAmount } = require("../../../shared/utils/creditScoreCalculator");
const { getProductConfig, MIN_CREDIT_SCORE_GLOBAL } = require("../../../shared/config/loanProducts");

/**
 * Apply for a new loan
 */
async function applyForLoan(data, userId) {
  const transaction = await sequelize.transaction();

  try {
    // 1. Fetch & validate user
    const user = await User.findByPk(userId, { transaction });
    if (!user) throw new Error("User not found.");
    if (user.status !== "active") throw new Error("User account is not active.");
    if (user.kyc_status !== "verified") throw new Error("KYC verification required before applying for a loan.");

    // 2. Validate linked account ownership
    const account = await accountService.getAccountById(data.linked_account_id, userId);
    if (!account || account.status !== "active") throw new Error("Linked account is not active.");

    // 3. Get product config
    const product = getProductConfig(data.loan_type);
    if (!product) throw new Error("Invalid loan type.");

    // 4. Credit score & eligibility
    const creditScore = calculateCreditScore({
      annual_income: parseFloat(data.annual_income),
      existing_liabilities: parseFloat(data.existing_liabilities),
      occupation: user.occupation,
    });

    const riskCategory = determineRiskCategory(creditScore);
    const emi = calculateEMI(data.requested_amount, product.interest_rate, data.tenure_months);

    const dtiCheck = evaluateDebtToIncomeRatio(
      parseFloat(data.annual_income),
      parseFloat(data.existing_liabilities),
      emi
    );

    // 5. Eligibility checks
    const rejectionReasons = [];

    if (creditScore < MIN_CREDIT_SCORE_GLOBAL) {
      rejectionReasons.push(`Credit score ${creditScore} is below minimum ${MIN_CREDIT_SCORE_GLOBAL}.`);
    }
    if (creditScore < product.min_credit_score) {
      rejectionReasons.push(`Credit score ${creditScore} is below ${product.min_credit_score} required for ${product.name}.`);
    }
    if (!dtiCheck.acceptable) {
      rejectionReasons.push(`Debt-to-income ratio ${(dtiCheck.ratio * 100).toFixed(1)}% exceeds 50% limit.`);
    }

    const maxEligible = getMaxEligibleAmount(
      parseFloat(data.annual_income),
      parseFloat(data.existing_liabilities),
      product.interest_rate,
      data.tenure_months
    );

    if (data.requested_amount > maxEligible) {
      rejectionReasons.push(`Requested ₹${data.requested_amount.toLocaleString("en-IN")} exceeds max eligible ₹${maxEligible.toLocaleString("en-IN")}.`);
    }

    const isApproved = rejectionReasons.length === 0;
    const totalPayable = isApproved ? calculateTotalPayable(emi, data.tenure_months) : null;

    // 6. Create loan record
    const loan = await Loan.create({
      user_id: userId,
      linked_account_id: data.linked_account_id,
      loan_type: data.loan_type,
      principal_amount: data.requested_amount,
      approved_amount: isApproved ? data.requested_amount : null,
      interest_rate: product.interest_rate,
      tenure_months: data.tenure_months,
      monthly_emi: isApproved ? emi : null,
      total_payable: totalPayable,
      outstanding_balance: isApproved ? data.requested_amount : null,
      next_due_date: null,
      loan_status: "active",
      approval_status: isApproved ? "approved" : "rejected",
      credit_score: creditScore,
      risk_category: riskCategory,
      rejection_reason: isApproved ? null : rejectionReasons.join(" "),
      issued_at: isApproved ? new Date() : null,
    }, { transaction });

    // 7. If approved: generate EMI schedule & disburse
    if (isApproved) {
      const schedule = generateAmortizationSchedule(
        data.requested_amount, product.interest_rate, data.tenure_months, new Date()
      );

      const scheduleRows = schedule.map((item) => ({
        loan_id: loan.loan_id,
        installment_number: item.installment_number,
        due_date: item.due_date,
        emi_amount: item.emi_amount,
        principal_component: item.principal_component,
        interest_component: item.interest_component,
        outstanding_after: item.outstanding_after,
        status: "upcoming",
      }));

      await EMISchedule.bulkCreate(scheduleRows, { transaction });

      // Set next due date
      loan.next_due_date = schedule[0].due_date;
      await loan.save({ transaction });

      // Disburse: credit linked account
      await accountService.updateBalance(data.linked_account_id, data.requested_amount, "credit");
    }

    await transaction.commit();

    // Audit log
    await auditService.createAuditLog({
      user_id: userId,
      action_type: isApproved ? "loan_approved" : "loan_rejected",
      entity_type: "loan",
      entity_id: loan.loan_id,
      status: isApproved ? "success" : "failure",
      metadata: { loan_type: data.loan_type, amount: data.requested_amount, credit_score: creditScore },
    });

    return {
      loan_id: loan.loan_id,
      loan_type: loan.loan_type,
      requested_amount: loan.principal_amount,
      approved_amount: loan.approved_amount,
      interest_rate: loan.interest_rate,
      monthly_emi: loan.monthly_emi,
      total_payable: loan.total_payable,
      tenure_months: loan.tenure_months,
      credit_score: creditScore,
      risk_category: riskCategory,
      approval_status: loan.approval_status,
      rejection_reason: loan.rejection_reason,
    };
  } catch (error) {
    await transaction.rollback();
     await auditService.createAuditLog({
    user_id: userId,
    action_type: "loan_application",
    entity_type: "loan",
    entity_id: null,
    status: "failure",
    metadata: {
      error: error.message,
      loan_type: data.loan_type,
      requested_amount: data.requested_amount,
    },
  });
    throw error;
  }
}

/**
 * Get loan by ID with ownership check
 */
async function getLoanById(loanId, userId) {
  const loan = await Loan.findOne({ where: { loan_id: loanId, user_id: userId } });
  if (!loan) throw new Error("Loan not found or unauthorized.");
  return loan;
}

/**
 * Get all loans for a user
 */
async function getUserLoans(userId) {
  return await Loan.findAll({
    where: { user_id: userId },
    order: [["created_at", "DESC"]],
  });
}

/**
 * Get EMI schedule for a loan
 */
async function getLoanSchedule(loanId, userId) {
  const loan = await getLoanById(loanId, userId);
  return await EMISchedule.findAll({
    where: { loan_id: loan.loan_id },
    order: [["installment_number", "ASC"]],
  });
}

/**
 * Process EMI payment
 */
async function processEMIPayment({ loan_id, payment_amount, source_account_id }, userId) {
  const transaction = await sequelize.transaction();

  try {
    const loan = await Loan.findOne({ where: { loan_id, user_id: userId }, transaction });
    if (!loan) throw new Error("Loan not found or unauthorized.");
    if (loan.approval_status !== "approved") throw new Error("Loan is not approved.");
    if (loan.loan_status !== "active") throw new Error("Loan is not active.");

    // Validate source account ownership
    await accountService.getAccountById(source_account_id, userId);

    // Find next due EMI
    const nextEMI = await EMISchedule.findOne({
      where: { loan_id, status: ["upcoming", "overdue"] },
      order: [["installment_number", "ASC"]],
      transaction,
    });

    if (!nextEMI) throw new Error("No pending EMI installments found.");

    if (payment_amount < parseFloat(nextEMI.emi_amount)) {
      throw new Error(`Payment amount ₹${payment_amount} is less than EMI amount ₹${nextEMI.emi_amount}.`);
    }

    // Debit source account
    await accountService.updateBalance(source_account_id, parseFloat(nextEMI.emi_amount), "debit");

    // Update EMI schedule
    nextEMI.status = "paid";
    nextEMI.paid_at = new Date();
    await nextEMI.save({ transaction });

    // Update loan outstanding
    const newOutstanding = parseFloat(loan.outstanding_balance) - parseFloat(nextEMI.principal_component);
    loan.outstanding_balance = parseFloat(Math.max(0, newOutstanding).toFixed(2));

    // Find next upcoming EMI for due date
    const upcomingEMI = await EMISchedule.findOne({
      where: { loan_id, status: "upcoming" },
      order: [["installment_number", "ASC"]],
      transaction,
    });

    loan.next_due_date = upcomingEMI ? upcomingEMI.due_date : null;

    // Auto-close if all paid
    if (!upcomingEMI && loan.outstanding_balance <= 0) {
      loan.loan_status = "closed";
      loan.closed_at = new Date();
    }

    await loan.save({ transaction });

    // Record repayment
    const repayment = await RepaymentHistory.create({
      loan_id,
      schedule_id: nextEMI.schedule_id,
      source_account_id,
      payment_amount: parseFloat(nextEMI.emi_amount),
      payment_type: "emi",
      paid_at: new Date(),
    }, { transaction });

    await transaction.commit();

    await auditService.createAuditLog({
      user_id: userId,
      action_type: "emi_payment",
      entity_type: "loan",
      entity_id: loan_id,
      status: "success",
      metadata: { installment: nextEMI.installment_number, amount: parseFloat(nextEMI.emi_amount) },
    });

    return repayment;
  } catch (error) {
    await transaction.rollback();
    await auditService.createAuditLog({
    user_id: userId,
    action_type: "emi_payment",
    entity_type: "loan",
    entity_id: loan_id,
    status: "failure",
    metadata: {
      error: error.message,
      payment_amount,
    },
  });
    throw error;
  }
}

/**
 * Process loan foreclosure
 */
async function processForeclosure(loanId, sourceAccountId, userId) {
  const transaction = await sequelize.transaction();

  try {
    const loan = await Loan.findOne({ where: { loan_id: loanId, user_id: userId }, transaction });
    if (!loan) throw new Error("Loan not found or unauthorized.");
    if (loan.loan_status !== "active") throw new Error("Loan is not active.");

    await accountService.getAccountById(sourceAccountId, userId);

    const product = getProductConfig(loan.loan_type);
    const foreclosure = calculateForeclosurePenalty(
      parseFloat(loan.outstanding_balance),
      product.foreclosure_penalty_rate
    );

    // Debit total foreclosure amount
    await accountService.updateBalance(sourceAccountId, foreclosure.total_foreclosure_amount, "debit");

    // Close all remaining upcoming EMIs
    await EMISchedule.update(
      { status: "paid", paid_at: new Date() },
      { where: { loan_id: loanId, status: ["upcoming", "overdue"] }, transaction }
    );

    // Update loan
    loan.outstanding_balance = 0;
    loan.loan_status = "foreclosed";
    loan.closed_at = new Date();
    loan.next_due_date = null;
    await loan.save({ transaction });

    // Record repayment
    await RepaymentHistory.create({
      loan_id: loanId,
      schedule_id: null,
      source_account_id: sourceAccountId,
      payment_amount: foreclosure.total_foreclosure_amount,
      payment_type: "foreclosure",
      paid_at: new Date(),
    }, { transaction });

    await transaction.commit();

    await auditService.createAuditLog({
      user_id: userId,
      action_type: "loan_foreclosure",
      entity_type: "loan",
      entity_id: loanId,
      status: "success",
      metadata: foreclosure,
    });

    return { loan_id: loanId, ...foreclosure, loan_status: "foreclosed" };
  } catch (error) {
    await transaction.rollback();
     await auditService.createAuditLog({
    user_id: userId,
    action_type: "loan_foreclosure",
    entity_type: "loan",
    entity_id: loanId,
    status: "failure",
    metadata: {
      error: error.message,
    },
  });
    throw error;
  }
}

/**
 * Mark loan as delinquent (for missed payments)
 */
async function markDelinquent(loanId) {
  const loan = await Loan.findByPk(loanId);
  if (!loan || loan.loan_status !== "active") return null;

  const today = new Date().toISOString().split("T")[0];

  const overdueCount = await EMISchedule.update(
    { status: "overdue" },
    { where: { loan_id: loanId, status: "upcoming", due_date: { [require("sequelize").Op.lt]: today } } }
  );

  const totalOverdue = await EMISchedule.count({
    where: { loan_id: loanId, status: "overdue" },
  });

  if (totalOverdue >= 3) {
    loan.loan_status = "defaulted";
    await loan.save();
  }

  return { loan_id: loanId, overdue_count: totalOverdue, defaulted: totalOverdue >= 3 };
}

/**
 * Close a fully paid loan
 */
async function closeLoan(loanId, userId) {
  try {
  const loan = await Loan.findOne({ where: { loan_id: loanId, user_id: userId } });
  if (!loan) throw new Error("Loan not found or unauthorized.");

  if (parseFloat(loan.outstanding_balance) > 0) {
    throw new Error("Cannot close loan with outstanding balance.");
  }

  loan.loan_status = "closed";
  loan.closed_at = new Date();
  loan.next_due_date = null;
  await loan.save();
  await auditService.createAuditLog({
  user_id: userId,
  action_type: "loan_closed",
  entity_type: "loan",
  entity_id: loanId,
  status: "success",
  metadata: {
    closed_at: loan.closed_at,
  },
});
  return loan;
} catch (error) {

    await auditService.createAuditLog({
      user_id: userId,
      action_type: "loan_closed",
      entity_type: "loan",
      entity_id: loanId,
      status: "failure",
      metadata: {
        error: error.message,
      },
    });

    throw error;
  }
}

/**
 * Update loan status (admin)
 */
async function updateLoanStatus(loanId, newStatus) {
  const validStatuses = ["active", "closed", "defaulted", "foreclosed"];
  if (!validStatuses.includes(newStatus)) throw new Error("Invalid loan status.");

  const loan = await Loan.findByPk(loanId);
  if (!loan) throw new Error("Loan not found.");

  loan.loan_status = newStatus;
  if (newStatus === "closed" || newStatus === "foreclosed") {
    loan.closed_at = new Date();
    loan.next_due_date = null;
  }
  await loan.save();

  return loan;
}

/**
 * Calculate accrued interest
 */
async function calculateInterest(loanId) {
  const loan = await Loan.findByPk(loanId);
  if (!loan) throw new Error("Loan not found.");

  const outstanding = parseFloat(loan.outstanding_balance);
  const monthlyRate = parseFloat(loan.interest_rate) / 12 / 100;
  const accruedInterest = parseFloat((outstanding * monthlyRate).toFixed(2));

  return {
    loan_id: loanId,
    outstanding_balance: outstanding,
    monthly_interest_rate: monthlyRate,
    accrued_interest: accruedInterest,
  };
}

module.exports = {
  applyForLoan,
  getLoanById,
  getUserLoans,
  getLoanSchedule,
  processEMIPayment,
  processForeclosure,
  markDelinquent,
  closeLoan,
  updateLoanStatus,
  calculateInterest,
};
