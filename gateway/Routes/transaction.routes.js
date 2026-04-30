const express = require("express");
const router = express.Router();

const transactionService = require("../../services/transaction-service");

router.use("/", transactionService);

module.exports = router;