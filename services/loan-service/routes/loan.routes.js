// /services/loan-service/routes/loan.routes.js

const express = require("express");
const router = express.Router();
const loanController = require("../controllers/loanController");

// ─── LOAN ROUTES ──────────────────────────────────────────────────────────────
// Auth middleware is applied at the gateway level

// IMPORTANT: /user/me must come before /:id to avoid conflict
router.get("/user/me", loanController.getUserLoans);

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

// Update loan status (admin)
router.patch("/status/:id", loanController.updateLoanStatus);

module.exports = router;
