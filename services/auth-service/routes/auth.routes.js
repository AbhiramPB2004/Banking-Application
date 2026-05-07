// /services/auth-service/routes/auth.routes.js

const express = require("express");
const router = express.Router();

const {
  registerUser,
  verifyEmail,
  resendEmailVerificationOtp,
  requestPasswordReset,
  resetPassword,
  loginUser,
  refreshToken,
  logoutUser
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
router.post("/login", loginUser);

/**
 * Token Refresh
 * POST /auth/refresh
 * No auth middleware — uses refresh_token cookie
 */
router.post("/refresh", refreshToken);

/**
 * Logout
 * POST /auth/logout
 * Clears cookies server-side and revokes session.
 * Uses authenticateToken optionally — if access_token is expired,
 * the user-agent still needs this to work, so we use a lenient version.
 */
router.post("/logout", logoutUser);

module.exports = router;
