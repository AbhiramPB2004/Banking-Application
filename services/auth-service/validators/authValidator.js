// /services/auth-service/validators/authValidator.js

const {
  validatePassword,
} = require("../../../shared/security/passwordPolicy");

const {
  validateTransactionPin,
} = require("../../../shared/security/transactionPinPolicy");

/**
 * Validate authentication-related registration data
 * Handles:
 * - Email
 * - Phone
 * - Password
 * - Transaction PIN
 */
function validateAuthInput(data) {
  const errors = [];

  // Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!data.email) {
    errors.push("Email is required.");
  } else if (
    data.email.length > 254 ||
    !emailRegex.test(data.email)
  ) {
    errors.push("Valid email is required.");
  }

  // Phone
  const phoneRegex = /^[0-9]{10}$/;
  if (!data.phone || !phoneRegex.test(data.phone)) {
    errors.push("Valid 10-digit phone number is required.");
  }

  // Password
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.valid) {
    errors.push(passwordValidation.message);
  }

  // PIN
  const pinValidation = validateTransactionPin(data.transaction_pin);
  if (!pinValidation.valid) {
    errors.push(pinValidation.message);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
module.exports = {
  validateAuthInput,
};