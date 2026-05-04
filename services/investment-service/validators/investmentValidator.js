// /services/investment-service/validators/investmentValidator.js

function isPositiveNumber(value) {
  return value !== undefined && value !== null && Number(value) > 0;
}

function validateBuyInput(data) {
  const errors = [];

  if (!data.source_account_id) {
    errors.push("Source account ID is required.");
  }

  if (!data.product_id) {
    errors.push("Product ID is required.");
  }

  if (!isPositiveNumber(data.amount)) {
    errors.push("Investment amount must be a positive number.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateSellInput(data) {
  const errors = [];

  if (!data.source_account_id) {
    errors.push("Source account ID is required.");
  }

  if (!data.product_id) {
    errors.push("Product ID is required.");
  }

  if (!isPositiveNumber(data.units)) {
    errors.push("Units must be a positive number.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateBuyInput,
  validateSellInput,
};
