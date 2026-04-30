const express = require("express");
const router = express.Router();

const { transferController } = require("../controllers/transaction.controller");

router.post("/transfer", transferController);

module.exports = router;