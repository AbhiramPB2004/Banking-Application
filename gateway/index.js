require("dotenv").config();
const express = require("express");
const app = express();
const { sequelize } = require("../shared/config/db");

// Import all models
require("../services/user-service/models/user.model");
require("../services/account-service/models/account.model");
require("../services/auth-service/models/session.model");
require("../services/audit-service/models/auditLog.model");
require("../services/credit-card-service/models/creditCard.model");

// Import Routes
const authRoutes = require("./Routes/auth.routes");
// Ensure this path matches your folder structure
const creditCardRoutes = require("../services/credit-card-service/routes/creditCard.routes");

app.use(express.json());

// Mount Routes
app.use("/auth", authRoutes);
app.use("/credit-cards", creditCardRoutes); // Fixes: /credit-cards/apply
app.use("/credit-cards", require("../services/credit-card-service/routes/creditcard.routes"));
sequelize.sync({ alter: true })
  .then(() => {
    const PORT = process.env.PORT || 5005;
    app.listen(PORT, () => {
      console.log(`Gateway running on port ${PORT}`);
    });
  })
  .catch((err) => console.error("Database sync failed:", err));