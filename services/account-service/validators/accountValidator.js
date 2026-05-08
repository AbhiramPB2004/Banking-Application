function validateAccountInput(data) {
  const errors = [];

  if (!data.account_type) {
    errors.push("Account type is required.");
  }

  const validTypes = ["savings", "current", "salary"];
  if (!validTypes.includes(data.account_type)) {
    errors.push("Invalid account type.");
  }

  if (!data.initial_deposit || data.initial_deposit <= 0) {
    errors.push("Initial deposit must be a positive number.");
  }

  if (data.initial_deposit < 1000) {
    errors.push("Minimum deposit must be at least ₹1000.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateAccountInput,
};