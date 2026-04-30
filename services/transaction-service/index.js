const express = require("express");
const router = express.Router();

const transactionRoutes = require("./routes/transaction.routes");

router.use("/", transactionRoutes);

module.exports = router;