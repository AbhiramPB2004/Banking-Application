// /gateway/index.js

require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();

const { sequelize } = require("../shared/config/db");

/**
 * Register Sequelize models
 * Must load before sync
 */
require("../services/user-service/models/user.model");
require("../services/account-service/models/account.model");
require("../services/auth-service/models/session.model");
require("../services/audit-service/models/auditLog.model");

/**
 * Shared Security Middleware
 */
const {
  authenticateToken,
} = require("../shared/middlewares/authMiddleware");

/**
 * Routes
 */
const authRoutes = require("./Routes/auth.routes");
const accountRoutes = require(
  "../services/account-service/routes/account.routes"
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
    "Banking API is running..."
  );
});

/**
 * Gateway Routes
 */
app.use("/auth", authRoutes);

app.use(
  "/accounts",
  authenticateToken,
  accountRoutes
);

/**
 * Database Sync + Server Start
 */
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log(
      "Database tables created/synced successfully."
    );

    const PORT =
      process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(
        `Gateway running on port ${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error(
      "Database sync failed:",
      error
    );
  });