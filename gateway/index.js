// /gateway/index.js

require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");

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

const creditCardRoutes = require(
  "../services/credit-card-service/routes/creditCard.routes"
);

/**
 * Global Middleware
 */
app.use(express.json());
app.use(cookieParser());

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
  })
  .catch((err) => {
    console.error(
      "Database sync failed:",
      err
    );
  });

module.exports = app;