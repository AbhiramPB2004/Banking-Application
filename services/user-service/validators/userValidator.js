// /services/user-service/validators/userValidator.js

function validateUserInput(data) {
  const errors = [];

  // Full Name
  if (!data.full_name || data.full_name.trim().length < 3) {
    errors.push("Full name must be at least 3 characters long.");
  }

  // Date of Birth
  const dob = data.date_of_birth || data.dateOfBirth;

if (!dob) {
  errors.push("Date of birth is required.");
  } else {
    const dob = new Date(data.dob);
    const age = new Date().getFullYear() - dob.getFullYear();

    if (age < 18) {
      errors.push("User must be at least 18 years old.");
    }
  }

  // Gender
  const allowedGenders = ["male", "female", "other"];
  if (!data.gender || !allowedGenders.includes(data.gender.toLowerCase())) {
    errors.push("Valid gender is required.");
  }

  // Address
  if (!data.address || data.address.trim().length < 10) {
    errors.push("Valid address is required.");
  }

  // Aadhaar
  const aadhaarRegex = /^[0-9]{12}$/;
  if (!data.aadhaar_number || !aadhaarRegex.test(data.aadhaar_number)) {
    errors.push("Valid 12-digit Aadhaar number is required.");
  }

  // PAN
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!data.pan_number || !panRegex.test(data.pan_number.toUpperCase())) {
    errors.push("Valid PAN number is required.");
  }

  // Occupation
  if (!data.occupation || data.occupation.trim().length < 2) {
    errors.push("Occupation is required.");
  }

  // Annual Income
  if (
    !data.annual_income ||
    isNaN(data.annual_income) ||
    Number(data.annual_income) < 0
  ) {
    errors.push("Valid annual income is required.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateUserInput,
};