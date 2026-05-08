// /services/loan-service/routes/loan.routes.js

const express = require("express");
const router = express.Router();
const loanController = require("../controllers/loanController");

// ─── LOAN ROUTES ──────────────────────────────────────────────────────────────
// Auth middleware is applied at the gateway level

// IMPORTANT: /user/me must come before /:id to avoid conflict
router.get("/user/me", loanController.getUserLoans);

// Active loans summary (slot count + total EMI for liabilities pre-fill)
// Must also precede /:id
router.get("/active-summary", loanController.getActiveLoansSummary);

// Loan application
router.post("/apply", loanController.applyNewLoan);

// EMI payment
router.post("/payment", loanController.makeLoanPayment);

// Get EMI schedule
router.get("/schedule/:id", loanController.generateLoanSchedule);

// Get loan details
router.get("/:id", loanController.getLoanDetails);

// Loan foreclosure
router.post("/foreclose/:id", loanController.processLoanForeclosure);

// Foreclosure preview (read-only, returns exact amounts before confirmation)
router.get("/foreclose-preview/:id", loanController.getForeclosurePreview);

// Update loan status (admin)
router.patch("/status/:id", loanController.updateLoanStatus);

module.exports = router;
