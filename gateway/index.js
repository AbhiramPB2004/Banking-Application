// /gateway/index.js

require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

const { sequelize } = require("../shared/config/db");

/**
 * Import all models
 */
require("../services/user-service/models/user.model");
require("../services/account-service/models/account.model");
require("../services/auth-service/models/session.model");
require("../services/audit-service/models/auditLog.model");
require("../services/credit-card-service/models/creditcard.model");

/**
 * Shared Security Middleware
 */
const {
  authenticateToken,
} = require(
  "../shared/middleware/authMiddleware"
);

/**
 * Import Routes
 */
const authRoutes = require(
  "./Routes/auth.routes"
);

/**
 * Import Credit Card Background Jobs Scheduler
 */
const initCreditCardJobs = require(
  "../services/credit-card-service/jobs/scheduler"
);

const creditCardRoutes = require(
  "../services/credit-card-service/routes/creditCard.routes"
);

/**
 * Global Middleware
 */
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

/**
 * Health Check
 */
app.get("/", (req, res) => {
  res.send(
    "Banking API Gateway is running..."
  );
});

/**
 * Public Routes
 */
app.use("/auth", authRoutes);

/**
 * Protected Routes
 */
app.use(
  "/credit-cards",
  authenticateToken,
  creditCardRoutes
);

/**
 * Database Sync + Gateway Startup
 */
sequelize
  .sync({ alter: true })
  .then(() => {
    const PORT =
      process.env.PORT || 5005;

    app.listen(PORT, () => {
      console.log(
        `Gateway running on port ${PORT}`
      );
    });

    /**
     * Start background jobs after DB is ready
     */
    initCreditCardJobs();
  })
  .catch((err) => {
    console.error(
      "Database sync failed:",
      err
    );
  });

module.exports = app;