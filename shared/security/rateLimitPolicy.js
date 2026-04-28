const rateLimit = require("express-rate-limit");

/**
 * General API rate limiter
 * Protects all routes from excessive requests
 */
const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // max 300 requests per IP
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth limiter
 * Prevents brute force login/register attempts
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20, // stricter for auth
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Transaction limiter
 * Extra security for money transfers
 */
const transactionRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // max transfer requests
  message: {
    success: false,
    message:
      "Transaction request limit exceeded. Please wait before making more transfers.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * OTP limiter
 * Prevents OTP spam abuse
 */
const otpRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: {
    success: false,
    message: "Too many OTP requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalRateLimiter,
  authRateLimiter,
  transactionRateLimiter,
  otpRateLimiter,
};