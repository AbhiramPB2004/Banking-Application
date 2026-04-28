// /gateway/routes/auth.routes.js

const express = require("express");
const router = express.Router();

// Correct path to auth-service index.js
const authService = require("../../services/auth-service/index");

// Mount auth service
router.use("/", authService);

module.exports = router;