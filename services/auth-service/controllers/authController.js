// /services/auth-service/controllers/authController.js
const bcrypt = require("bcrypt");
const {
  validateLoginInput,
} = require("../validators/loginValidator");
// const notificationService = require("../../notification-service/services/notification.service");
const {
  validateAuthInput,
} = require("../validators/authValidator");

const {
  validateUserInput,
} = require("../../user-service/validators/userValidator");

const {
  validateAccountInput,
} = require("../../account-service/validators/accountValidator");

const notificationService = require("../../notification-service/services/notification.service");

const {
  checkExistingUser,
  createUser,
  activateUser,
  getUserByEmail
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
  logLogin,
  logSecurityEvent
} = require("../../audit-service/services/auditService");

/**
 * User Registration Controller
 *
 * Security:
 * - Access token → HTTP-only cookie
 * - Refresh token → HTTP-only cookie
 * - No token exposure in JSON body
 */
async function registerUser(req, res) {
  try {
    const { auth, user, account } = req.body;

    /**
     * Step 1: Validate Inputs
     */
    const authValidation = validateAuthInput(auth);
    const userValidation = validateUserInput(user);
    const accountValidation = validateAccountInput(account);

    const validationErrors = [
      ...authValidation.errors,
      ...userValidation.errors,
      ...accountValidation.errors,
    ];

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: validationErrors,
      });
    }

    /**
     * Step 2: Check Existing User
     */
    const existingUser = await checkExistingUser({
      email: auth.email,
      phone: auth.phone,
      aadhaar_number: user.aadhaar_number,
      pan_number: user.pan_number,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "User with provided email, phone, Aadhaar, or PAN already exists.",
      });
    }

    /**
     * Step 3: Hash Credentials
     */
    const {
      password_hash,
      transaction_pin_hash,
    } = await prepareUserCredentials(
      auth.password,
      auth.transaction_pin
    );

    /**
     * Step 4: Create User
     */
    const newUser = await createUser({
      ...auth,
      ...user,
      password_hash,
      transaction_pin_hash,
    });

    /**
     * Step 5: Create Account
     */
    // console.log(account)
    const newAccount = await createAccount({
      user_id: newUser.user_id,
      account_type: account.account_type,
      initial_deposit: account.initial_deposit,
      branch_code: account.branch_code,
      ifsc_code: account.ifsc_code,
    });

    /**
     * Step 6: Activate User
     */
    await activateUser(newUser.user_id);

    /**
     * Step 7: Generate Tokens
     */
    const tokens = generateUserTokens(newUser);

    /**
     * Step 8: Create Session
     */
    await createSession({
      user_id: newUser.user_id,
      refresh_token: tokens.refresh_token,
      device_info:
        req.headers["user-agent"] || "Unknown Device",
      ip_address: req.ip,
    });

    /**
     * Step 9: Audit Logs
     */
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

    /**
     * Step 10: Set Secure Cookies
     */
    const cookieOptions = {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite: "Strict",
    };

    res.cookie(
      "access_token",
      tokens.access_token,
      {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000, // 15 mins
      }
    );

    res.cookie(
      "refresh_token",
      tokens.refresh_token,
      {
        ...cookieOptions,
        maxAge:
          7 * 24 * 60 * 60 * 1000, // 7 days
      }
    );
    await notificationService.notifyRegister(newUser);
    // await notificationService.sendNotification({
    //   user_id: newUser.user_id, 
    //   type: "email",
    //   recipient: auth.email,
    //   message: "Your bank account has been created successfully.",
    // });

    /**
     * Step 11: Success Response
     */
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
        account_number:
          newAccount.account_number,
        account_type:
          newAccount.account_type,
        balance: newAccount.balance,
      },
    });
  } catch (error) {
    console.error(
      "Registration Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error during registration.",
      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  }
}

/**
 * User Login Controller
 *
 * Handles:
 * - User authentication
 * - Password verification
 * - JWT generation
 * - Session replacement
 * - Secure cookie token delivery
 * - Audit logging
 */
async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    /**
     * Step 1: Validate Input
     */
    const validation =
      validateLoginInput({
        email,
        password,
      });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors,
      });
    }

    /**
     * Step 2: Find User
     */
    const user =
      await getUserByEmail(email);

    if (!user) {
      await logSecurityEvent({
        action_type:
          "login_failed",
        ip_address: req.ip,
        status: "failure",
        metadata: {
          email,
          reason:
            "User not found",
        },
      });

      return res.status(401).json({
        success: false,
        message:
          "Invalid credentials.",
      });
    }

    /**
     * Step 3: Verify Password
     */
    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password_hash
      );

    if (!passwordMatch) {
      await logSecurityEvent({
        user_id:
          user.user_id,
        action_type:
          "login_failed",
        entity_id:
          user.user_id,
        ip_address:
          req.ip,
        status:
          "failure",
        metadata: {
          reason:
            "Incorrect password",
        },
      });

      return res.status(401).json({
        success: false,
        message:
          "Invalid credentials.",
      });
    }

    /**
     * Step 4: Verify Account Status
     */
    if (
      user.status !==
      "active"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "User account is not active.",
      });
    }

    /**
     * Step 5: Generate JWT Tokens
     */
    const tokens =
      generateUserTokens(
        user
      );

    /**
     * Step 6: Replace Previous Session
     */
    await createSession({
      user_id:
        user.user_id,
      refresh_token:
        tokens.refresh_token,
      device_info:
        req.headers[
          "user-agent"
        ] ||
        "Unknown Device",
      ip_address:
        req.ip,
    });

    /**
     * Step 7: Set Secure Cookies
     */
    const cookieOptions = {
      httpOnly: true,
      secure:
        process.env
          .NODE_ENV ===
        "production",
      sameSite:
        "Strict",
    };

    res.cookie(
      "access_token",
      tokens.access_token,
      {
        ...cookieOptions,
        maxAge:
          15 *
          60 *
          1000,
      }
    );

    res.cookie(
      "refresh_token",
      tokens.refresh_token,
      {
        ...cookieOptions,
        maxAge:
          7 *
          24 *
          60 *
          60 *
          1000,
      }
    );
    await notificationService.notifyLogin(user, req.ip);
    /**
     * Step 8: Audit Success
     */
    await logLogin({
      user_id:
        user.user_id,
      ip_address:
        req.ip,
      status:
        "success",
      metadata: {
        email:
          user.email,
      },
    });

    /**
     * Step 9: Success Response
     */
    return res.status(200).json({
      success: true,
      message:
        "Login successful.",
      user: {
        user_id:
          user.user_id,
        full_name:
          user.full_name,
        email:
          user.email,
        role:
          user.role,
        status:
          user.status,
      },
    });
  } catch (error) {
    console.error(
      "Login Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error during login.",
      error:
        process.env
          .NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  }
}

module.exports = {
  registerUser,
  loginUser
};