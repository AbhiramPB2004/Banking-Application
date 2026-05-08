const User = require("../models/user.model");
const { Op } = require("sequelize");

/**
 * Check duplicate user
 */
async function checkExistingUser({
  email,
  phone,
  aadhaar_number,
  pan_number,
}) {
  return await User.findOne({
    where: {
      [Op.or]: [
        { email },
        { phone },
        { aadhaar_number },
        { pan_number },
      ],
    },
  });
}

/**
 * Create user
 */
async function createUser(userData) {
  return await User.create({
    full_name: userData.full_name,
    email: userData.email,
    phone: userData.phone,
    password_hash: userData.password_hash,
    transaction_pin_hash: userData.transaction_pin_hash,
    dob: userData.dob,
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
}

/**
 * Get user by ID
 */
async function getUserById(user_id) {
  return await User.findByPk(user_id);
}

/**
 * Get user by Email
 */
async function getUserByEmail(email) {
  return await User.findOne({
    where: { email },
  });
}

/**
 * Update profile
 */
async function updateUserProfile(user_id, data) {
  const user = await User.findByPk(user_id);

  if (!user) throw new Error("User not found.");

  const allowedFields = [
    "full_name",
    "phone",
    "address",
    "occupation",
    "annual_income",
  ];

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      user[field] = data[field];
    }
  });

  await user.save();
  return user;
}

/**
 * Update KYC
 */
/**
 * Update KYC (Aadhaar & PAN immutable after first set)
 */
async function updateKYCStatus(user_id, data) {
  const user = await User.findByPk(user_id);

  if (!user) throw new Error("User not found.");

  // 🚫 Aadhaar update not allowed if already exists
  if (user.aadhaar_number && data.aadhaar_number) {
    throw new Error("Aadhaar number cannot be updated once submitted.");
  }

  // 🚫 PAN update not allowed if already exists
  if (user.pan_number && data.pan_number) {
    throw new Error("PAN number cannot be updated once submitted.");
  }

  // ✅ Set Aadhaar (only first time)
  if (!user.aadhaar_number && data.aadhaar_number) {
    user.aadhaar_number = data.aadhaar_number;
  }

  // ✅ Set PAN (only first time)
  if (!user.pan_number && data.pan_number) {
    user.pan_number = data.pan_number;
  }

  // ✅ Update KYC status
  if (data.kyc_status) {
    user.kyc_status = data.kyc_status;
  } else {
    user.kyc_status = "verified";
  }

  await user.save();

  return user;
}


/**
 * Verify KYC (Admin)
 */
async function verifyKYC(user_id) {
  const user = await User.findByPk(user_id);

  if (!user) throw new Error("User not found.");

  // Optional: ensure user has submitted KYC
  if (!user.aadhaar_number || !user.pan_number) {
    throw new Error("KYC not submitted yet.");
  }

  user.kyc_status = "verified";

  await user.save();

  return user;
}

/**
 * Activate user
 */
async function activateUser(user_id) {
  const user = await User.findByPk(user_id);

  if (!user) throw new Error("User not found.");

  user.status = "active";
  await user.save();

  return user;
}

/**
 * Suspend user
 */
async function suspendUser(user_id) {
  const user = await User.findByPk(user_id);

  if (!user) throw new Error("User not found.");

  user.status = "suspended";
  await user.save();

  return user;
}

/**
 * Close user
 */
async function closeUser(user_id) {
  const user = await User.findByPk(user_id);

  if (!user) throw new Error("User not found.");

  user.status = "closed";
  await user.save();

  return user;
}

/**
 * Admin get all users
 */
async function getAllUsers() {
  return await User.findAll({
    order: [["created_at", "DESC"]],
  });
}

module.exports = {
  checkExistingUser,
  createUser,
  getUserById,
  getUserByEmail,
  updateUserProfile,
  updateKYCStatus,
  activateUser,
  suspendUser,
  closeUser,
  getAllUsers,
  verifyKYC,
};