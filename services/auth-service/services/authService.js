// /services/auth-service/services/authService.js

const Session = require("../models/session.model");
const EmailOtp = require("../models/emailOtp.model");
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

function generateNumericOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

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

async function createEmailOtp({
  user_id,
  email,
  purpose,
  expiresInMinutes = 10,
}) {
  await EmailOtp.update(
    { status: "expired" },
    {
      where: {
        user_id,
        purpose,
        status: "active",
      },
    }
  );

  const otp = generateNumericOtp();
  const otp_hash = await bcrypt.hash(otp, 10);
  const expires_at = new Date();
  expires_at.setMinutes(expires_at.getMinutes() + expiresInMinutes);

  await EmailOtp.create({
    user_id,
    email,
    purpose,
    otp_hash,
    expires_at,
    status: "active",
  });

  return {
    otp,
    expires_at,
  };
}

async function verifyEmailOtp({ email, otp, purpose }) {
  const record = await EmailOtp.findOne({
    where: {
      email,
      purpose,
      status: "active",
    },
    order: [["created_at", "DESC"]],
  });

  if (!record) {
    throw new Error("Invalid or expired OTP.");
  }

  if (record.expires_at < new Date()) {
    record.status = "expired";
    await record.save();
    throw new Error("Invalid or expired OTP.");
  }

  if (record.attempts >= 5) {
    record.status = "expired";
    await record.save();
    throw new Error("Too many OTP attempts. Please request a new OTP.");
  }

  const matches = await bcrypt.compare(otp, record.otp_hash);

  if (!matches) {
    record.attempts += 1;
    await record.save();
    throw new Error("Invalid or expired OTP.");
  }

  record.status = "consumed";
  record.consumed_at = new Date();
  await record.save();

  return record;
}

async function updatePassword(user, newPassword) {
  user.password_hash = await hashPassword(newPassword);
  await user.save();
  await revokeSession(user.user_id);

  return true;
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
  createEmailOtp,
  verifyEmailOtp,
  updatePassword,
  generateUserTokens,
  revokeSession,
  getActiveSession,
};
