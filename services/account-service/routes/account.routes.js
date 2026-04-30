const express = require("express");
const router = express.Router();

const {
  createAccountController,
  getAccountController,
} = require("../controllers/account.controller");

router.post("/create", createAccountController);
router.get("/:user_id", getAccountController);

module.exports = router;