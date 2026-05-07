const ACCOUNT_RULES = {
  savings: {
    minDeposit: 1000,
    maxBalance: 500000000, // ₹50 Crore
  },

  current: {
    minDeposit: 5000,
    maxBalance: null, // Unlimited
  },

  salary: {
    minDeposit: 0,
    maxBalance: null, // Unlimited
  },
};

const VALID_TYPES = ["savings", "current", "salary"];

function validateAccountInput(data) {
  const errors = [];

  // -------------------------
  // Allowed Fields Validation
  // -------------------------

  const allowedFields = [
    "account_type",
    "initial_deposit",
    "branch_code",
  ];

  Object.keys(data).forEach((key) => {
    if (!allowedFields.includes(key)) {
      errors.push({
        field: key,
        message: "Invalid field",
      });
    }
  });

  // -------------------------
  // Normalize Inputs
  // -------------------------

  const account_type =
    typeof data.account_type === "string"
      ? data.account_type.toLowerCase().trim()
      : "";

  const deposit = Number(data.initial_deposit);

  // -------------------------
  // Account Type Validation
  // -------------------------

  if (!account_type) {
    errors.push({
      field: "account_type",
      message: "Account type is required.",
    });

  } else if (!VALID_TYPES.includes(account_type)) {
    errors.push({
      field: "account_type",
      message: "Allowed: savings, current, salary",
    });
  }

  // -------------------------
  // Optional Branch Code Validation
  // -------------------------

  if (data.branch_code) {

    // Must contain only digits
    if (!/^\d+$/.test(data.branch_code)) {
      errors.push({
        field: "branch_code",
        message: "Branch code must contain only digits",
      });
    }

    // Must be exactly 4 digits
    if (data.branch_code.length !== 4) {
      errors.push({
        field: "branch_code",
        message: "Branch code must be exactly 4 digits",
      });
    }
  }

  // -------------------------
  // Deposit Validation
  // -------------------------

  if (
    data.initial_deposit === undefined ||
    data.initial_deposit === null ||
    data.initial_deposit === ""
  ) {
    errors.push({
      field: "initial_deposit",
      message: "Initial deposit is required",
    });

  } else if (isNaN(deposit)) {
    errors.push({
      field: "initial_deposit",
      message: "Must be a valid number",
    });

  } else {

    // Infinite number protection
    if (!Number.isFinite(deposit)) {
      errors.push({
        field: "initial_deposit",
        message: "Deposit must be finite",
      });
    }

    // Negative check
    if (deposit < 0) {
      errors.push({
        field: "initial_deposit",
        message: "Cannot be negative",
      });
    }

    // Zero check
    if (deposit === 0 && account_type !== "salary") {
      errors.push({
        field: "initial_deposit",
        message: "Must be greater than 0",
      });
    }

    // Decimal precision check
    if (Math.round(deposit * 100) !== deposit * 100) {
      errors.push({
        field: "initial_deposit",
        message: "Max 2 decimal places allowed",
      });
    }

    // Safe integer protection
    if (!Number.isSafeInteger(Math.floor(deposit))) {
      errors.push({
        field: "initial_deposit",
        message: "Unsafe numeric value",
      });
    }

    // -------------------------
    // Account-Type Specific Rules
    // -------------------------

    if (ACCOUNT_RULES[account_type]) {

      const rules = ACCOUNT_RULES[account_type];

      // Minimum deposit validation
      if (deposit < rules.minDeposit) {
        errors.push({
          field: "initial_deposit",
          message:
            `${account_type} account requires minimum deposit of ₹${rules.minDeposit}`,
        });
      }

      // Maximum balance validation
      if (
        rules.maxBalance !== null &&
        deposit > rules.maxBalance
      ) {
        errors.push({
          field: "initial_deposit",
          message:
            `${account_type} account cannot exceed ₹${rules.maxBalance}`,
        });
      }
    }

    // -------------------------
    // Compliance / AML Checks
    // -------------------------

    // Suspiciously large deposits
    if (deposit >= 10000000) {
      errors.push({
        field: "initial_deposit",
        message:
          "Large deposits require manual compliance verification",
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateAccountInput,
};