// /services/loan-service/index.js

const express = require("express");
const router = require("./routes/loan.routes");

const app = express();

app.use(express.json());
app.use("/", router);

// Initialize background jobs
const { startEMIScheduler } = require("./jobs/emiScheduler");
const { startRepaymentTracker } = require("./jobs/repaymentTracker");

/**
 * Start all loan service background jobs
 */
function initializeJobs() {
  try {
    startEMIScheduler();
    startRepaymentTracker();
    console.log("Loan service jobs initialized.");
  } catch (error) {
    console.error("Failed to initialize loan jobs:", error.message);
  }
}

module.exports = { app, initializeJobs };
