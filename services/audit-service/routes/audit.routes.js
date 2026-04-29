const express = require("express");
const router = express.Router();

const { getAllLogs } = require("../controllers/auditController");

router.get("/all", getAllLogs);

module.exports = router;