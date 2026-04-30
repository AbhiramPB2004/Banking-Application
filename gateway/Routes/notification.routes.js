const express = require("express");
const router = express.Router();

const notificationService = require("../../services/notification-service");

router.use("/", notificationService);

module.exports = router;