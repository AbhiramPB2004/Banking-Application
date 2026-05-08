const validateCreateFD = (req, res, next) => {
  const {
    account_id,
    amount,
    tenure_months,
    interest_rate,
  } = req.body;

  const errors = [];

  // Account ID
  if (
    !account_id ||
    typeof account_id !== "string" ||
    account_id.trim() === ""
  ) {
    errors.push("Valid account_id is required.");
  }

  // Amount
  if (
    amount === null ||
    amount === "" ||
    typeof amount !== "number" ||
    isNaN(amount)
  ) {
    errors.push("Amount must be numeric.");
  } else {
    if (amount < 1000) {
      errors.push(
        "Minimum FD amount is 1000."
      );
    }

    if (amount > 100000000) {
      errors.push(
        "Maximum FD amount is 1,00,00,000."
      );
    }
  }

  // Tenure
  if (
    tenure_months === null ||
    tenure_months === "" ||
    typeof tenure_months !== "number" ||
    isNaN(tenure_months)
  ) {
    errors.push("Tenure must be numeric.");
  } else {
    if (tenure_months < 3) {
      errors.push(
        "Minimum FD tenure is 3 months."
      );
    }

    if (tenure_months > 120) {
      errors.push(
        "Maximum FD tenure is 120 months."
      );
    }
  }

  // Interest Rate
  if (
    interest_rate === null ||
    interest_rate === "" ||
    typeof interest_rate !== "number" ||
    isNaN(interest_rate)
  ) {
    errors.push(
      "Interest rate must be numeric."
    );
  } else {
    if (interest_rate < 4.5) {
      errors.push(
        "Minimum interest rate is 4.5%."
      );
    }

    if (interest_rate > 15) {
      errors.push(
        "Maximum interest rate is 15%."
      );
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  next();
};

module.exports = {
  validateCreateFD,
};