const express = require("express");
const router = express.Router();

const accountService = require("../../services/account-service");

router.use("/", accountService);

module.exports = router;