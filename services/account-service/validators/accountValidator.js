// /services/account-service/validators/accountValidator.js

function validateAccountInput(data) {
  const errors = [];

  // Account Type
  const allowedAccountTypes = ["savings", "current", "salary"];
  if (
    !data.account_type ||
    !allowedAccountTypes.includes(data.account_type.toLowerCase())
  ) {
    errors.push("Valid account type is required.");
  }

  // Initial Deposit
  if (
    !data.initial_deposit ||
    isNaN(data.initial_deposit) ||
    Number(data.initial_deposit) < 1000
  ) {
    errors.push("Initial deposit must be at least ₹1000.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateAccountInput,
};