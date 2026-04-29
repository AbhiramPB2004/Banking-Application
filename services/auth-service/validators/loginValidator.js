// /services/auth-service/validators/loginValidator.js

/**
 * Validate login credentials
 *
 * Handles:
 * - Email validation
 * - Password presence validation
 *
 * Security:
 * - Prevent malformed auth requests
 * - Fail-fast validation
 */

function validateLoginInput(data) {
  const errors = [];

  /**
   * Email Validation
   */
  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!data.email) {
    errors.push("Email is required.");
  } else if (
    data.email.length > 254 ||
    !emailRegex.test(data.email)
  ) {
    errors.push("Valid email is required.");
  }

  /**
   * Password Validation
   */
  if (!data.password) {
    errors.push("Password is required.");
  } else if (
    typeof data.password !== "string" ||
    data.password.trim().length < 8
  ) {
    errors.push(
      "Valid password is required."
    );
  }

  /**
   * Return validation result
   */
  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateLoginInput,
};