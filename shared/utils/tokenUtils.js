const jwt = require("jsonwebtoken");

/**
 * Environment secrets
 */
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET;

/**
 * Generate Access Token
 * Short-lived token for API access
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
}

/**
 * Generate Refresh Token
 * Long-lived token for session renewal
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
}

/**
 * Verify Access Token
 */
function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);

    return {
      valid: true,
      expired: false,
      decoded,
    };
  } catch (error) {
    return {
      valid: false,
      expired: error.name === "TokenExpiredError",
      message: error.message,
    };
  }
}

/**
 * Verify Refresh Token
 */
function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);

    return {
      valid: true,
      expired: false,
      decoded,
    };
  } catch (error) {
    return {
      valid: false,
      expired: error.name === "TokenExpiredError",
      message: error.message,
    };
  }
}

/**
 * "Delete" token (stateless JWT)
 * Since JWT cannot be destroyed directly,
 * client-side deletion + optional blacklist is used.
 */
function invalidateToken() {
  return {
    message:
      "Token invalidation should be handled by client-side removal or server-side blacklist/session revocation.",
  };
}

/**
 * Extract token from Bearer header
 */
function extractTokenFromHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.split(" ")[1];
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  invalidateToken,
  extractTokenFromHeader,
};