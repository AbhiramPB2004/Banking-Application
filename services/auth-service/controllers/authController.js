// /services/auth-service/controllers/authController.js

const { sequelize } = require("../../../shared/config/db");

const {
  validateAuthInput,
} = require("../validators/authValidator");

const {
  validateUserInput,
} = require("../../user-service/validators/userValidator");

const {
  validateAccountInput,
} = require("../../account-service/validators/accountValidator");

const {
  checkExistingUser,
  createUser,
  activateUser,
} = require("../../user-service/services/userService");

const {
  createAccount,
} = require("../../account-service/services/accountService");

const {
  prepareUserCredentials,
  generateUserTokens,
  createSession,
} = require("../services/authService");

const {
  logRegistration,
  logAccountCreation,
} = require("../../audit-service/services/auditService");

/**
 * User Registration Controller
 */
async function registerUser(req, res) {
console.log(process.env.DB_PASSWORD);
  const transaction = await sequelize.transaction();

  try {
    const {
      auth,
      user,
      account,
    } = req.body;

    // ---------------------------
    // Step 1: Validate Inputs
    // ---------------------------
    const authValidation = validateAuthInput(auth);
    const userValidation = validateUserInput(user);
    const accountValidation = validateAccountInput(account);

    const validationErrors = [
      ...authValidation.errors,
      ...userValidation.errors,
      ...accountValidation.errors,
    ];

    if (validationErrors.length > 0) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        errors: validationErrors,
      });
    }

    // ---------------------------
    // Step 2: Check Existing User
    // ---------------------------
    const existingUser = await checkExistingUser({
      email: auth.email,
      phone: auth.phone,
      aadhaar_number: user.aadhaar_number,
      pan_number: user.pan_number,
    });

    if (existingUser) {
      await transaction.rollback();

      return res.status(409).json({
        success: false,
        message:
          "User with provided email, phone, Aadhaar, or PAN already exists.",
      });
    }

    // ---------------------------
    // Step 3: Hash Credentials
    // ---------------------------
    const {
      password_hash,
      transaction_pin_hash,
    } = await prepareUserCredentials(
      auth.password,
      auth.transaction_pin
    );

    // ---------------------------
    // Step 4: Create User
    // ---------------------------
    const newUser = await createUser({
      ...auth,
      ...user,
      password_hash,
      transaction_pin_hash,
    });

    // ---------------------------
    // Step 5: Create Account
    // ---------------------------
    const newAccount = await createAccount({
      user_id: newUser.user_id,
      account_type: account.account_type,
      initial_deposit: account.initial_deposit,
    });

    // ---------------------------
    // Step 6: Activate User
    // ---------------------------
    await activateUser(newUser.user_id);

    // ---------------------------
    // Step 7: Generate Tokens
    // ---------------------------
    const tokens = generateUserTokens(newUser);

    // ---------------------------
    // Step 8: Create Session
    // ---------------------------
    await createSession({
      user_id: newUser.user_id,
      refresh_token: tokens.refresh_token,
      device_info: req.headers["user-agent"] || "Unknown Device",
      ip_address: req.ip,
    });

    // ---------------------------
    // Step 9: Audit Logs
    // ---------------------------
    await logRegistration({
      user_id: newUser.user_id,
      ip_address: req.ip,
      status: "success",
      metadata: {
        email: newUser.email,
      },
    });

    await logAccountCreation({
      user_id: newUser.user_id,
      account_id: newAccount.account_id,
      ip_address: req.ip,
      status: "success",
      metadata: {
        account_number: newAccount.account_number,
      },
    });

    // ---------------------------
    // Step 10: Commit Transaction
    // ---------------------------
    await transaction.commit();

    // ---------------------------
    // Step 11: Success Response
    // ---------------------------
    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      user: {
        user_id: newUser.user_id,
        full_name: newUser.full_name,
        email: newUser.email,
        phone: newUser.phone,
        status: "active",
      },
      account: {
        account_id: newAccount.account_id,
        account_number: newAccount.account_number,
        account_type: newAccount.account_type,
        balance: newAccount.balance,
      },
      tokens,
    });
  } catch (error) {
    await transaction.rollback();

    console.error("Registration Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error during registration.",
    });
  }
}

module.exports = {
  registerUser,
};