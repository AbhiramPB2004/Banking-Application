// /shared/middlewares/securityMiddleware.js

const jwt = require("jsonwebtoken");

/**
 * Centralized JWT Authentication Middleware
 *
 * Security Model:
 * - JWT sourced ONLY from HTTP-only cookies
 * - No Authorization header dependency
 * - Gateway-trusted identity
 * - req.user.user_id = trusted source
 */

function authenticateToken(
  req,
  res,
  next
) {
  try {
    /**
     * Extract access token from secure cookies
     */
    const token =
      req.cookies?.access_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication token required.",
      });
    }

    /**
     * Verify JWT
     */
    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    /**
     * Attach trusted user context
     */
    req.user = {
      user_id:
        decoded.user_id,
      email:
        decoded.email,
      role:
        decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired token.",
    });
  }
}

/**
 * Admin Authorization Middleware
 */
function requireAdmin(
  req,
  res,
  next
) {
  if (
    !req.user ||
    req.user.role !== "admin"
  ) {
    return res.status(403).json({
      success: false,
      message:
        "Admin access required.",
    });
  }

  next();
}

module.exports = {
  authenticateToken,
  requireAdmin,
};