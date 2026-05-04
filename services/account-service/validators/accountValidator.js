const VALID_TYPES = ["savings", "current", "salary"];

function validateAccountInput(data) {
  const errors = [];

  const allowedFields = ["account_type", "initial_deposit"];

  // Reject unknown fields
  Object.keys(data).forEach((key) => {
    if (!allowedFields.includes(key)) {
      errors.push({ field: key, message: "Invalid field" });
    }
  });

  const account_type = data.account_type?.toLowerCase().trim();
  const deposit = Number(data.initial_deposit);

  // Account type
  if (!account_type) {
    errors.push({ field: "account_type", message: "Account type is required." });
  } else if (!VALID_TYPES.includes(account_type)) {
    errors.push({
      field: "account_type",
      message: "Allowed: savings, current, salary",
    });
  }

  // Deposit validation
  if (isNaN(deposit)) {
    errors.push({
      field: "initial_deposit",
      message: "Must be a valid number",
    });
  } else {
    if (deposit <= 0) {
      errors.push({
        field: "initial_deposit",
        message: "Must be greater than 0",
      });
    }

    if (deposit < 1000) {
      errors.push({
        field: "initial_deposit",
        message: "Minimum ₹1000 required",
      });
    }

    if (deposit > 10000000) {
      errors.push({
        field: "initial_deposit",
        message: "Exceeds allowed limit",
      });
    }

    if (Math.round(deposit * 100) !== deposit * 100) {
      errors.push({
        field: "initial_deposit",
        message: "Max 2 decimal places allowed",
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = { validateAccountInput };