const express = require("express");
const router = express.Router();

const accountController = require("../controllers/accountController");

const { authenticateToken } = require("../../../shared/middlewares/authMiddleware");

// Apply middleware
router.use(authenticateToken);

// Routes
router.post("/", accountController.createAccount);

router.get("/user/me", accountController.getUserAccounts);
router.get("/:id", accountController.getAccountById);

router.put("/:id", accountController.updateAccount);
router.delete("/:id", accountController.closeAccount);

module.exports = router;