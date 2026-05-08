const express = require("express");
const router = express.Router();
const controller = require("../controllers/notification.controller");

router.post("/send", controller.send);

module.exports = router;