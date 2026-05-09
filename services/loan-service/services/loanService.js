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

    // ── Active loan checks ───────────────────────────────────────────────────
    // Fetch all currently active, approved loans for this user.
    const activeLoans = await Loan.findAll({
      where: { user_id: userId, approval_status: "approved", loan_status: "active" },
      transaction,
    });

    // Hard cap: max 3 active loans at a time.
    // This prevents unlimited debt accumulation.
    const MAX_ACTIVE_LOANS = 3;
    if (activeLoans.length >= MAX_ACTIVE_LOANS) {
      throw new Error(
        `You already have ${activeLoans.length} active loan(s). ` +
        `Maximum ${MAX_ACTIVE_LOANS} active loans are allowed. ` +
        `Please close or foreclose an existing loan before applying for a new one.`
      );
    }

    // Sum all existing monthly EMIs from active loans.
    // These are mandatory financial obligations and MUST be factored into the DTI check
    // regardless of what the applicant self-reports in existing_liabilities.
    const activeEmiTotal = activeLoans.reduce(
      (sum, l) => sum + parseFloat(l.monthly_emi || 0),
      0
    );

    // Combine self-reported liabilities with system-calculated active EMIs.
    // System total always includes actual active debt — the user cannot omit it.
    const totalLiabilities = parseFloat(data.existing_liabilities || 0) + activeEmiTotal;

    // 4. Credit score & eligibility
    const creditScore = calculateCreditScore({
      annual_income: parseFloat(data.annual_income),
      existing_liabilities: totalLiabilities, // uses verified total, not just self-reported
      occupation: user.occupation,
    });

    const riskCategory = determineRiskCategory(creditScore);
    const emi = calculateEMI(data.requested_amount, product.interest_rate, data.tenure_months);

    const dtiCheck = evaluateDebtToIncomeRatio(
      parseFloat(data.annual_income),
      totalLiabilities, // DTI must include all active obligations
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
 * Process EMI payment — supports paying multiple installments at once.
 *
 * Prepayment penalty logic:
 *   - Paying 1 installment (current due): no penalty.
 *   - Paying N > 1 installments: a prepayment penalty applies to the
 *     principal components of installments 2…N (the ones paid ahead of schedule).
 *   - Penalty = sum_of_extra_principal × (product.prepayment_penalty_rate / 100)
 *   - Total debit = sum_of_all_emi_amounts + penalty_amount
 */
async function processEMIPayment({ loan_id, payment_amount, source_account_id, installments_to_pay = 1 }, userId) {
  const transaction = await sequelize.transaction();

  try {
    const loan = await Loan.findOne({ where: { loan_id, user_id: userId }, transaction });
    if (!loan) throw new Error("Loan not found or unauthorized.");
    if (loan.approval_status !== "approved") throw new Error("Loan is not approved.");
    if (loan.loan_status !== "active") throw new Error("Loan is not active.");

    await accountService.getAccountById(source_account_id, userId);

    // Fetch the next N pending installments in order
    const count = Math.max(1, Math.min(parseInt(installments_to_pay) || 1, 12));

    const pendingInstallments = await EMISchedule.findAll({
      where: { loan_id, status: ["upcoming", "overdue"] },
      order: [["installment_number", "ASC"]],
      limit: count,
      transaction,
    });

    if (!pendingInstallments.length) throw new Error("No pending EMI installments found.");

    // Can't pay more installments than exist
    if (pendingInstallments.length < count) {
      throw new Error(
        `Only ${pendingInstallments.length} installment(s) remaining. Cannot pay ${count}.`
      );
    }

    // ── Penalty calculation ──────────────────────────────────────────────
    const product = getProductConfig(loan.loan_type);
    const prepaymentRate = product?.prepayment_penalty_rate ?? 2; // default 2%

    // First installment is the one currently due — no penalty on it.
    // Penalty applies only to the EXTRA principal paid ahead of schedule.
    const extraInstallments = pendingInstallments.slice(1); // installments 2…N
    const extraPrincipalSum = extraInstallments.reduce(
      (sum, emi) => sum + parseFloat(emi.principal_component),
      0
    );
    const penaltyAmount = count > 1
      ? parseFloat(((extraPrincipalSum * prepaymentRate) / 100).toFixed(2))
      : 0;

    // ── Total EMI sum ────────────────────────────────────────────────────
    const totalEmiSum = parseFloat(
      pendingInstallments.reduce((s, e) => s + parseFloat(e.emi_amount), 0).toFixed(2)
    );
    const totalDue = parseFloat((totalEmiSum + penaltyAmount).toFixed(2));

    // ── Validate submitted amount ────────────────────────────────────────
    const submitted = parseFloat(parseFloat(payment_amount).toFixed(2));
    const TOLERANCE = 0.01;
    if (submitted < totalDue - TOLERANCE) {
      throw new Error(
        `Payment amount ₹${submitted.toFixed(2)} is less than total due ₹${totalDue.toFixed(2)}` +
        (penaltyAmount > 0
          ? ` (EMIs: ₹${totalEmiSum.toFixed(2)} + prepayment penalty: ₹${penaltyAmount.toFixed(2)})`
          : ".")
      );
    }

    // ── Debit source account (total including penalty) ───────────────────
    await accountService.updateBalance(source_account_id, totalDue, "debit");

    // ── Mark all selected installments as paid ───────────────────────────
    for (const emi of pendingInstallments) {
      emi.status = "paid";
      emi.paid_at = new Date();
      await emi.save({ transaction });
    }

    // ── Update loan outstanding balance ──────────────────────────────────
    const totalPrincipalPaid = parseFloat(
      pendingInstallments.reduce((s, e) => s + parseFloat(e.principal_component), 0).toFixed(2)
    );
    const newOutstanding = parseFloat(loan.outstanding_balance) - totalPrincipalPaid;
    loan.outstanding_balance = parseFloat(Math.max(0, newOutstanding).toFixed(2));

    // ── Advance next due date ─────────────────────────────────────────────
    const nextUpcoming = await EMISchedule.findOne({
      where: { loan_id, status: "upcoming" },
      order: [["installment_number", "ASC"]],
      transaction,
    });

    loan.next_due_date = nextUpcoming ? nextUpcoming.due_date : null;

    if (!nextUpcoming && loan.outstanding_balance <= 0) {
      loan.loan_status = "closed";
      loan.closed_at = new Date();
    }

    await loan.save({ transaction });

    // ── Record repayment ──────────────────────────────────────────────────
    const repayment = await RepaymentHistory.create({
      loan_id,
      schedule_id: pendingInstallments[0].schedule_id, // reference to first paid installment
      source_account_id,
      payment_amount: totalDue,
      payment_type: count > 1 ? "partial" : "emi",
      paid_at: new Date(),
    }, { transaction });

    await transaction.commit();

    await auditService.createAuditLog({
      user_id: userId,
      action_type: count > 1 ? "bulk_emi_prepayment" : "emi_payment",
      entity_type: "loan",
      entity_id: loan_id,
      status: "success",
      metadata: {
        installments_paid: count,
        emi_total: totalEmiSum,
        prepayment_penalty: penaltyAmount,
        total_charged: totalDue,
        prepayment_rate_pct: prepaymentRate,
      },
    });

    return {
      ...repayment.toJSON(),
      installments_paid: count,
      emi_total: totalEmiSum,
      prepayment_penalty: penaltyAmount,
      total_charged: totalDue,
      prepayment_rate_pct: prepaymentRate,
      new_outstanding_balance: loan.outstanding_balance,
      loan_status: loan.loan_status,
    };
  } catch (error) {
    await transaction.rollback();
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
  const loan = await Loan.findOne({ where: { loan_id: loanId, user_id: userId } });
  if (!loan) throw new Error("Loan not found or unauthorized.");

  if (parseFloat(loan.outstanding_balance) > 0) {
    throw new Error("Cannot close loan with outstanding balance.");
  }

  loan.loan_status = "closed";
  loan.closed_at = new Date();
  loan.next_due_date = null;
  await loan.save();

  return loan;
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

/**
 * Get foreclosure preview (read-only, no payment)
 * Returns the exact breakdown so the UI can show accurate amounts before confirmation.
 */
async function getForeclosurePreview(loanId, userId) {
  const loan = await Loan.findOne({ where: { loan_id: loanId, user_id: userId } });
  if (!loan) throw new Error("Loan not found or unauthorized.");
  if (loan.loan_status !== "active") throw new Error("Loan is not active.");
  if (loan.approval_status !== "approved") throw new Error("Loan is not approved.");

  const product = getProductConfig(loan.loan_type);
  const foreclosure = calculateForeclosurePenalty(
    parseFloat(loan.outstanding_balance),
    product.foreclosure_penalty_rate
  );

  // Count remaining installments
  const remainingCount = await EMISchedule.count({
    where: { loan_id: loanId, status: ["upcoming", "overdue"] }
  });

  return {
    loan_id: loanId,
    loan_type: loan.loan_type,
    product_name: product.name,
    foreclosure_penalty_rate: product.foreclosure_penalty_rate,
    remaining_installments: remainingCount,
    ...foreclosure,
  };
}

/**
 * Get active loans summary for the current user.
 * Used by the frontend to:
 *  1. Pre-fill the "Existing Liabilities" field with the sum of active EMIs.
 *  2. Show how many loan slots remain (max 3).
 */
async function getActiveLoansSummary(userId) {
  const MAX_ACTIVE_LOANS = 3;

  const activeLoans = await Loan.findAll({
    where: { user_id: userId, approval_status: "approved", loan_status: "active" },
    attributes: ["loan_id", "loan_type", "monthly_emi", "outstanding_balance", "next_due_date"],
    order: [["created_at", "ASC"]],
  });

  const totalMonthlyEmi = parseFloat(
    activeLoans.reduce((sum, l) => sum + parseFloat(l.monthly_emi || 0), 0).toFixed(2)
  );

  const totalOutstanding = parseFloat(
    activeLoans.reduce((sum, l) => sum + parseFloat(l.outstanding_balance || 0), 0).toFixed(2)
  );

  return {
    active_loan_count: activeLoans.length,
    max_active_loans: MAX_ACTIVE_LOANS,
    remaining_slots: Math.max(0, MAX_ACTIVE_LOANS - activeLoans.length),
    can_apply: activeLoans.length < MAX_ACTIVE_LOANS,
    total_monthly_emi: totalMonthlyEmi,      // auto-added to liabilities during DTI check
    total_outstanding: totalOutstanding,
    active_loans: activeLoans.map(l => ({
      loan_id: l.loan_id,
      loan_type: l.loan_type,
      monthly_emi: parseFloat(l.monthly_emi),
    })),
  };
}

module.exports = {
  applyForLoan,
  getLoanById,
  getUserLoans,
  getActiveLoansSummary,
  getLoanSchedule,
  processEMIPayment,
  processForeclosure,
  getForeclosurePreview,
  markDelinquent,
  closeLoan,
  updateLoanStatus,
  calculateInterest,
};
