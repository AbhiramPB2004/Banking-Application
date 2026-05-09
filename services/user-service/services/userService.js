const User = require("../models/user.model");
const { Op } = require("sequelize");
const { comparePassword } = require("../../../shared/security/passwordPolicy");
const { hashTransactionPin, validateTransactionPin } = require("../../../shared/security/transactionPinPolicy");
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

  if (!user) {
    throw new Error("User not found.");
  }

  const allowedFields = [
    "full_name",
    "phone",
    "address",
    "occupation",
    "annual_income",
  ];

  // Full Name validation
  // Full Name validation
if (data.full_name !== undefined) {

  // Null or empty
  if (
    data.full_name === null ||
    data.full_name.trim() === ""
  ) {
    throw new Error("full_name cannot be empty or null.");
  }

  // Minimum length
  if (data.full_name.trim().length < 3) {
    throw new Error(
      "full_name must be at least 3 characters long."
    );
  }
}
  // Phone validation
  // Phone validation
if (data.phone !== undefined) {

  // Empty or null
  if (
    data.phone === null ||
    data.phone.trim() === ""
  ) {
    throw new Error("phone cannot be empty or null.");
  }

  // Must be exactly 10 digits
  const phoneRegex = /^[0-9]{10}$/;

  if (!phoneRegex.test(data.phone)) {
    throw new Error(
      "Phone number must contain exactly 10 digits."
    );
  }
}

  // Address validation
  if (
    data.address !== undefined &&
    (
      data.address === null ||
      data.address.trim() === ""
    )
  ) {
    throw new Error("address cannot be empty or null.");
  }

  // Occupation validation
  // Occupation validation
if (data.occupation !== undefined) {

  // Null or empty
  if (
    data.occupation === null ||
    data.occupation.trim() === ""
  ) {
    throw new Error(
      "occupation cannot be empty or null."
    );
  }

  // Only alphabets and spaces allowed
  const occupationRegex = /^[A-Za-z\s]+$/;

  if (!occupationRegex.test(data.occupation.trim())) {
    throw new Error(
      "occupation must contain only alphabets and spaces."
    );
  }
}

  // Annual Income validation
  if (data.annual_income !== undefined) {

    // Empty or null
    if (
      data.annual_income === null ||
      data.annual_income === ""
    ) {
      throw new Error("annual_income cannot be empty.");
    }

    // Zero or negative
    if (Number(data.annual_income) <= 0) {
      throw new Error(
        "annual_income must be greater than 0."
      );
    }
  }

  // Update fields
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

  //  Aadhaar update not allowed if already exists
  if (user.aadhaar_number && data.aadhaar_number) {
    throw new Error("Aadhaar number cannot be updated once submitted.");
  }

  //  PAN update not allowed if already exists
  if (user.pan_number && data.pan_number) {
    throw new Error("PAN number cannot be updated once submitted.");
  }

  //  Set Aadhaar (only first time)
  if (!user.aadhaar_number && data.aadhaar_number) {
    user.aadhaar_number = data.aadhaar_number;
  }

  //  Set PAN (only first time)
  if (!user.pan_number && data.pan_number) {
    user.pan_number = data.pan_number;
  }

  //  Update KYC status
  if (data.kyc_status) {
    user.kyc_status = data.kyc_status;
  } else {
    user.kyc_status = "verified";
  }

  await user.save();

  return user;
}


async function resetTransactionPin(user_id, accountPassword, newPin) {
  const user = await User.findByPk(user_id);
  if (!user) throw new Error("User not found.");

  // 1. Verify account password
  const isPasswordValid = await comparePassword(accountPassword, user.password_hash);
  if (!isPasswordValid) {
    throw new Error("Incorrect account password.");
  }

  // 2. Validate new PIN
  const pinValidation = validateTransactionPin(newPin);
  if (!pinValidation.valid) {
    throw new Error(pinValidation.message);
  }

  // 3. Check weak patterns
  const weakPins = ["0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999", "1234", "123456"];
  if (weakPins.includes(newPin)) {
    throw new Error("PIN is too weak. Please choose a more secure PIN.");
  }

  // 4. Update PIN
  user.transaction_pin_hash = await hashTransactionPin(newPin);
  await user.save();

  return true;
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
  resetTransactionPin,
};