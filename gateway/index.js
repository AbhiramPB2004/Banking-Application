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
require("../services/auth-service/models/emailOtp.model");
require("../services/audit-service/models/auditLog.model");
require("../services/loan-service/models/loan.model");
require("../services/investment-service/models/investmentProduct.model");
require("../services/investment-service/models/portfolio.model");
require("../services/investment-service/models/holding.model");
require("../services/investment-service/models/investmentTransaction.model");
require("../services/investment-service/models/navHistory.model");
require("../services/FD-service/models/fd.model");
const {
  authenticateToken,
} = require("../shared/middlewares/authMiddleware");
const creditCardRoutes = require(
  "../services/credit-card-service/routes/creditCard.routes"
);

// Routes
const authRoutes = require("./Routes/auth.routes");
const userRoutes = require("./Routes/user.routes");
const accountRoutes = require(
  "../services/account-service/routes/account.routes"
);
const adminRoutes = require(
  "../services/admin-service/routes/admin.routes"
);

app.use(
  "/admin",
  authenticateToken,
  adminRoutes
);
const transactionRoutes = require("../services/transaction-service/routes/transaction.routes");
const loanRoutes = require("../services/loan-service/routes/loan.routes");
const investmentRoutes = require(
  "../services/investment-service/routes/investment.routes"
);
const fdRoutes = require(
  "../services/FD-service/routes/fd.routes"
);

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

app.use(
  "/credit-cards",
  authenticateToken,
  creditCardRoutes
);
app.use(
  "/fd",
  authenticateToken,
  fdRoutes
);
app.use("/transactions", authenticateToken ,transactionRoutes); 
app.use(
  "/investments",
  authenticateToken,
  investmentRoutes
);

// Initialize Loan Service Jobs
const { initializeJobs } = require("../services/loan-service/index");
initializeJobs();

// Initialize Investment Service Jobs
const {
  initializeJobs: initializeInvestmentJobs,
} = require("../services/investment-service/index");
initializeInvestmentJobs();

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
