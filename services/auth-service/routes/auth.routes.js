// /services/auth-service/routes/auth.routes.js

const express = require("express");
const router = express.Router();

const {
  registerUser,
  verifyEmail,
  resendEmailVerificationOtp,
  requestPasswordReset,
  resetPassword,
  loginUser
} = require("../controllers/authController");

/**
 * User Registration Route
 * POST /auth/register
 */
router.post("/register", registerUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification-otp", resendEmailVerificationOtp);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.post(
  "/login",
  loginUser
);

module.exports = router;
