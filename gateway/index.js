// /gateway/index.js

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const app = express();

// CORS — allow frontend origin with credentials (cookies)
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

const { sequelize } = require("../shared/config/db");

// Import all models so Sequelize can register them
require("../services/user-service/models/user.model");
require("../services/account-service/models/account.model");
require("../services/auth-service/models/session.model");
require("../services/audit-service/models/auditLog.model");
require("../services/loan-service/models/loan.model");
const {
  authenticateToken,
} = require("../shared/middlewares/authMiddleware");

// Routes
const authRoutes = require("./Routes/auth.routes");
const userRoutes = require("./Routes/user.routes");
const accountRoutes = require(
  "../services/account-service/routes/account.routes"
);
const loanRoutes = require("../services/loan-service/routes/loan.routes");
const cookieParser = require("cookie-parser");
// Middleware
app.use(express.json());
app.use(cookieParser());


// Gateway routes
app.use("/auth", authRoutes);
app.use("/user", authenticateToken , userRoutes);
app.use(
  "/accounts",
  authenticateToken,
  accountRoutes
);
app.use(
  "/loans",
  authenticateToken,
  loanRoutes
);

// Initialize Loan Service Jobs
const { initializeJobs } = require("../services/loan-service/index");
initializeJobs();

/**
 * Sync database tables
 * Development use only
 */
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Database tables created/synced successfully.");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Gateway running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database sync failed:", error);
  });