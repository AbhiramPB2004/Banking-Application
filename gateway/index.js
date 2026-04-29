// /gateway/index.js

require("dotenv").config();

const express = require("express");
const app = express();

const { sequelize } = require("../shared/config/db");

// Import all models so Sequelize can register them
require("../services/user-service/models/user.model");
require("../services/account-service/models/account.model");
require("../services/auth-service/models/session.model");
require("../services/audit-service/models/auditLog.model");
const authenticateToken = require("../shared/middlewares/authMiddleware");
// Routes
const authRoutes = require("./Routes/auth.routes");
const userRoutes = require("./Routes/user.routes");

// Middleware
app.use(express.json());

// Gateway routes
app.use("/auth", authRoutes);
app.use("/user", authenticateToken , userRoutes);

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