// /gateway/routes/auth.routes.js

const express = require("express");
const router = express.Router();

// Correct path to auth-service index.js
const userService = require("../../services/user-service/index");

// Mount auth service
router.use("/", userService);

module.exports = router;