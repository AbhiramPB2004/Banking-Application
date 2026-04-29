const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser   // ✅ ADD THIS
} = require("../controllers/authController");

/**
 * User Registration
 */
router.post("/register", registerUser);

/**
 * User Login
 */
router.post("/login", loginUser);   // ✅ ADD THIS

module.exports = router;