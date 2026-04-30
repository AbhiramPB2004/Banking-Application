// /services/user-service/services/userService.js

const User = require("../models/user.model");

/**
 * Check if user already exists by:
 * - Email
 * - Phone
 * - Aadhaar
 * - PAN
 */
async function checkExistingUser({ email, phone, aadhaar_number, pan_number }) {
  const existingUser = await User.findOne({
    where: {
      [require("sequelize").Op.or]: [
        { email },
        { phone },
        { aadhaar_number },
        { pan_number },
      ],
    },
  });

  return existingUser;
}

/**
 * Create new banking user
 */
async function createUser(userData) {
  const newUser = await User.create({
    full_name: userData.full_name,
    email: userData.email,
    phone: userData.phone,
    password_hash: userData.password_hash,
    transaction_pin_hash: userData.transaction_pin_hash,
    dob: userData.date_of_birth || userData.dateOfBirth,
    gender: userData.gender,
    address: userData.address,
    aadhaar_number: userData.aadhaar_number,
    pan_number: userData.pan_number,
    occupation: userData.occupation,
    annual_income: userData.annual_income,
    kyc_status: "pending",
    role: "customer",
    status: "pending",
  });

  return newUser;
}

/**
 * Get user by ID
 */
async function getUserById(user_id) {
  return await User.findByPk(user_id);
}

/**
 * Get user by email
 */
async function getUserByEmail(email) {
  return await User.findOne({
    where: { email },
  });
}

/**
 * Activate user after successful onboarding
 */
async function activateUser(user_id) {
  const user = await User.findByPk(user_id);

  if (!user) {
    throw new Error("User not found.");
  }

  user.status = "active";
  await user.save();

  return user;
}

module.exports = {
  checkExistingUser,
  createUser,
  getUserById,
  getUserByEmail,
  activateUser,
};

