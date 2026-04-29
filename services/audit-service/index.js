const express = require("express");
const app = express();

const auditRoutes = require("./routes/audit.routes");

app.use(express.json());
app.use("/audit", auditRoutes);

module.exports = app;