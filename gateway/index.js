// /gateway/index.js

require("dotenv").config();

const express = require("express");
const app = express();

const { sequelize } = require("../shared/config/db");

// 🔥 1. GLOBAL MIDDLEWARES (ALWAYS FIRST)
app.use(express.json());

// 🔥 2. IMPORT ROUTES
const authRoutes = require("./Routes/auth.routes");
const accountRoutes = require("../services/account-service/routes/account.routes");

// 🔥 3. REGISTER ROUTES
app.use("/auth", authRoutes);
app.use("/accounts", accountRoutes);

// 🔥 4. REGISTER MODELS (for Sequelize)
require("../services/user-service/models/user.model");
require("../services/account-service/models/account.model");
require("../services/auth-service/models/session.model");
require("../services/audit-service/models/auditLog.model");

// 🔥 5. HEALTH CHECK (optional but useful)
app.get("/", (req, res) => {
  res.send("Banking API is running...");
});

// 🔥 6. DATABASE SYNC + SERVER START
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