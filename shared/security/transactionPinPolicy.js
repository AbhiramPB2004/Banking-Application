const bcrypt = require("bcrypt");

// Basic banking-style PIN policy
// Supports 4 or 6 digit PINs
const PIN_REGEX = /^\d{4,6}$/;

/**
 * Validate transaction PIN
 * Requirements:
 * - Required
 * - Only numeric
 * - 4 to 6 digits
 */
function validateTransactionPin(pin) {
  if (!pin) {
    return {
      valid: false,
      message: "Transaction PIN is required",
    };
  }

  if (!PIN_REGEX.test(pin)) {
    return {
      valid: false,
      message:
        "Transaction PIN must be numeric and contain 4 to 6 digits only.",
    };
  }

  return {
    valid: true,
    message: "Transaction PIN is valid",
  };
}

/**
 * Hash PIN before storing
 */
async function hashTransactionPin(pin) {
  const saltRounds = 10;
  return await bcrypt.hash(pin, saltRounds);
}

/**
 * Compare entered PIN with stored hash
 */
async function compareTransactionPin(pin, hashedPin) {
  return await bcrypt.compare(pin, hashedPin);
}

module.exports = {
  validateTransactionPin,
  hashTransactionPin,
  compareTransactionPin,
};