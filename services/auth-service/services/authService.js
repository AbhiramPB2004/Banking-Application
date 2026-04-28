// /services/auth-service/services/authService.js

const Session = require("../models/session.model");
const bcrypt = require("bcrypt");

const {
  hashPassword,
} = require("../../../shared/security/passwordPolicy");

const {
  hashTransactionPin,
} = require("../../../shared/security/transactionPinPolicy");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../../shared/utils/tokenUtils");

/**
 * Hash user credentials
 */
async function prepareUserCredentials(password, transaction_pin) {
  const password_hash = await hashPassword(password);
  const transaction_pin_hash = await hashTransactionPin(transaction_pin);

  return {
    password_hash,
    transaction_pin_hash,
  };
}

/**
 * Create banking session
 * One active session per user
 */
async function createSession({
  user_id,
  refresh_token,
  device_info,
  ip_address,
}) {
  // Remove old session if exists
  await Session.destroy({
    where: { user_id },
  });

  // Hash refresh token before storing
  const refresh_token_hash = await bcrypt.hash(refresh_token, 10);

  // Expiry = 7 days
  const expires_at = new Date();
  expires_at.setDate(expires_at.getDate() + 7);

  // Create new session
  const session = await Session.create({
    user_id,
    refresh_token_hash,
    device_info,
    ip_address,
    expires_at,
    is_active: true,
  });

  return session;
}

/**
 * Generate secure auth tokens
 */
function generateUserTokens(user) {
  const payload = {
    user_id: user.user_id,
    email: user.email,
    role: user.role,
  };

  const access_token = generateAccessToken(payload);
  const refresh_token = generateRefreshToken(payload);

  return {
    access_token,
    refresh_token,
  };
}

/**
 * Logout user
 */
async function revokeSession(user_id) {
  await Session.destroy({
    where: { user_id },
  });

  return true;
}

/**
 * Get active session
 */
async function getActiveSession(user_id) {
  return await Session.findOne({
    where: {
      user_id,
      is_active: true,
    },
  });
}

module.exports = {
  prepareUserCredentials,
  createSession,
  generateUserTokens,
  revokeSession,
  getActiveSession,
};