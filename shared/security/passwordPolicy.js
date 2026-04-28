const bcrypt = require("bcrypt");

// Minimum commercial-style password policy
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
function validatePassword(password) {
  if (!password) {
    return {
      valid: false,
      message: "Password is required",
    };
  }

  if (!PASSWORD_REGEX.test(password)) {
    return {
      valid: false,
      message:
        "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
    };
  }

  return {
    valid: true,
    message: "Password is valid",
  };
}

/**
 * Hash password before storing in DB
 */
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compare raw password with hashed password
 */
async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

module.exports = {
  validatePassword,
  hashPassword,
  comparePassword,
};