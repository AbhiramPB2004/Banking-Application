const crypto = require("crypto");

/**
 * Generate a unique banking account number
 * Format Example:
 * BANK + BRANCH + RANDOM DIGITS
 * Example:
 * 1025202600012345
 *
 * Structure:
 * [Bank Code: 4 digits]
 * [Branch Code: 4 digits]
 * [Random Unique Number: 8 digits]
 */

/**
 * Generate random numeric string
 */
function generateRandomDigits(length) {
  let digits = "";

  while (digits.length < length) {
    digits += crypto.randomInt(0, 10).toString();
  }

  return digits;
}

/**
 * Generate account number
 * @param {string} bankCode - Example: "1025"
 * @param {string} branchCode - Example: "2026"
 */
function generateAccountNumber(bankCode = "1025", branchCode = "0001") {
  if (!/^\d{4}$/.test(bankCode)) {
    throw new Error("Bank code must be exactly 4 digits.");
  }

  if (!/^\d{4}$/.test(branchCode)) {
    throw new Error("Branch code must be exactly 4 digits.");
  }

  const uniqueDigits = generateRandomDigits(8);

  return `${bankCode}${branchCode}${uniqueDigits}`;
}

/**
 * Basic validator
 */
function validateAccountNumber(accountNumber) {
  return /^\d{16}$/.test(accountNumber);
}

module.exports = {
  generateAccountNumber,
  validateAccountNumber,
};