// /services/loan-service/controllers/loanController.js

const loanService = require("../services/loanService");
const { validateLoanApplication, validateRepaymentInput, validateForeclosureInput } = require("../validators/loanValidator");
const auditService = require("../../audit-service/services/auditService");

/**
 * Apply for a new loan
 */
async function applyNewLoan(req, res) {
  try {
    const userId = req.user.user_id;
    const data = req.body;

    const validation = validateLoanApplication(data);
    if (!validation.valid) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }

    const result = await loanService.applyForLoan(data, userId);

    const statusCode = result.approval_status === "approved" ? 201 : 200;
    const message = result.approval_status === "approved"
      ? "Loan approved and disbursed successfully."
      : "Loan application rejected.";

    return res.status(statusCode).json({ success: true, message, data: result });
  } catch (error) {
    console.error("Loan application error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Get active loans summary (count, total EMI, remaining slots)
 * Used by the loan application modal to pre-fill liabilities.
 */
async function getActiveLoansSummary(req, res) {
  try {
    const userId = req.user.user_id;
    const result = await loanService.getActiveLoansSummary(userId);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Get loan details by ID
 */
async function getLoanDetails(req, res) {
  try {
    const userId = req.user.user_id;
    const { id } = req.params;

    const loan = await loanService.getLoanById(id, userId);
    return res.json({ success: true, data: loan });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
}

/**
 * Get all loans for authenticated user
 */
async function getUserLoans(req, res) {
  try {
    const userId = req.user.user_id;
    const loans = await loanService.getUserLoans(userId);
    return res.json({ success: true, data: loans });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Make EMI payment
 */
async function makeLoanPayment(req, res) {
  try {
    const userId = req.user.user_id;
    const data = req.body;

    const validation = validateRepaymentInput(data);
    if (!validation.valid) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }

    const result = await loanService.processEMIPayment(data, userId);
    return res.json({ success: true, message: "EMI payment processed successfully.", data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

/**
 * Get EMI schedule for a loan
 */
async function generateLoanSchedule(req, res) {
  try {
    const userId = req.user.user_id;
    const { id } = req.params;

    const schedule = await loanService.getLoanSchedule(id, userId);
    return res.json({ success: true, data: schedule });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
}

/**
 * Get foreclosure preview — exact amounts without executing payment
 */
async function getForeclosurePreview(req, res) {
  try {
    const userId = req.user.user_id;
    const { id } = req.params;
    const result = await loanService.getForeclosurePreview(id, userId);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

/**
 * Process loan foreclosure
 */
async function processLoanForeclosure(req, res) {
  try {
    const userId = req.user.user_id;
    const { id } = req.params;
    const { source_account_id } = req.body;

    const validation = validateForeclosureInput({ loan_id: id, source_account_id });
    if (!validation.valid) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }

    const result = await loanService.processForeclosure(id, source_account_id, userId);
    return res.json({ success: true, message: "Loan foreclosed successfully.", data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

/**
 * Update loan status (admin)
 */
async function updateLoanStatus(req, res) {
  try {
    const { id } = req.params;
    const { loan_status } = req.body;

    if (!loan_status) {
      return res.status(400).json({ success: false, message: "loan_status is required." });
    }

    const result = await loanService.updateLoanStatus(id, loan_status);

    await auditService.createAuditLog({
      user_id: req.user.user_id,
      action_type: "loan_status_update",
      entity_type: "loan",
      entity_id: id,
      status: "success",
      metadata: { new_status: loan_status },
    });

    return res.json({ success: true, message: "Loan status updated.", data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

module.exports = {
  applyNewLoan,
  getLoanDetails,
  getUserLoans,
  getActiveLoansSummary,
  makeLoanPayment,
  generateLoanSchedule,
  processLoanForeclosure,
  getForeclosurePreview,
  updateLoanStatus,
};
