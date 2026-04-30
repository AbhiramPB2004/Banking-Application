// /services/auth-service/routes/auth.routes.js

const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser
} = require("../controllers/authController");

/**
 * User Registration Route
 * POST /auth/register
 */
router.post("/register", registerUser);
router.post(
  "/login",
  loginUser
);

module.exports = router;