const express = require("express");
const router = express.Router();

// controller
const controller = require("../controllers/transactionController");

// middlewares
// const authMiddleware = require("../../../shared/middleware/authMiddleware");
const verifyTransactionPin = require("../../../shared/middlewares/pinMiddleware");

// 🔍 DEBUG (REMOVE LATER)
console.log("transfer:", typeof controller.transfer);
console.log("deposit:", typeof controller.deposit);
console.log("withdraw:", typeof controller.withdraw);
console.log("getHistory:", typeof controller.getHistory);
console.log("authMiddleware:", typeof authMiddleware);
console.log("verifyTransactionPin:", typeof verifyTransactionPin);

// routes
router.post("/transfer", verifyTransactionPin, controller.transfer);
router.post("/deposit",  verifyTransactionPin, controller.deposit);
router.post("/withdraw", verifyTransactionPin, controller.withdraw);
router.get("/history/:account_id", controller.getHistory);

module.exports = router;