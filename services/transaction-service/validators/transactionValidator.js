function validateTransactionInput(data) {
  const errors = [];

  if (!data.amount || isNaN(data.amount) || Number(data.amount) <= 0) {
    errors.push("Amount must be greater than 0.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateTransactionInput,
};