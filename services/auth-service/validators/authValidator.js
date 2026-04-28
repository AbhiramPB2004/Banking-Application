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

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    errors.push("Valid email is required.");
  }

  // Phone validation (10 digits)
  const phoneRegex = /^[0-9]{10}$/;
  if (!data.phone || !phoneRegex.test(data.phone)) {
    errors.push("Valid 10-digit phone number is required.");
  }

  // Password validation
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.valid) {
    errors.push(passwordValidation.message);
  }

  // Transaction PIN validation
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