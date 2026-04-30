require("dotenv").config();

const express = require("express");
const app = express();

const { sequelize } = require("../shared/config/db");

// Models
require("../services/user-service/models/user.model");
require("../services/account-service/models/account.model");
require("../services/auth-service/models/session.model");
require("../services/audit-service/models/auditLog.model");
require("../services/notification-service/models/notification.model");


// Routes
const authRoutes = require("./Routes/auth.routes");
const notificationRoutes = require("./Routes/notification.routes");
const accountRoutes = require("./Routes/account.routes");
const transactionRoutes = require("./Routes/transaction.routes");

// Middleware
app.use(express.json());

// Gateway routes
app.use("/auth", authRoutes);
app.use("/notification", notificationRoutes);
app.use("/account", accountRoutes);
app.use("/transaction", transactionRoutes);

// Start server
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