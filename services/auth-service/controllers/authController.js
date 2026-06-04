// /services/auth-service/controllers/authController.js
const bcrypt = require("bcrypt");
const Account = require("../../account-service/models/account.model");
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
  createEmailOtp,
  verifyEmailOtp,
  updatePassword,
  getActiveSession,
  revokeSession,
} = require("../services/authService");

const {
  validatePassword,
} = require("../../../shared/security/passwordPolicy");

const {
  logRegistration,
  logAccountCreation,
  logLogin,
  logSecurityEvent
} = require("../../audit-service/services/auditService");

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "None" : "Lax",
    path: "/",
  };
}

function setAuthCookies(res, tokens) {
  const cookieOptions = getCookieOptions();

  res.cookie(
    "access_token",
    tokens.access_token,
    {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    }
  );

  res.cookie(
    "refresh_token",
    tokens.refresh_token,
    {
      ...cookieOptions,
      maxAge:
        7 * 24 * 60 * 60 * 1000,
    }
  );
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

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

    if (auth?.email) {
      auth.email = normalizeEmail(auth.email);
    }

    /**
     * Step 1: Validate Inputs
     */
    const authValidation = validateAuthInput(auth);
    const userValidation = validateUserInput(user);
    // const accountValidation = validateAccountInput(account);

    const validationErrors = [
      ...authValidation.errors,
      ...userValidation.errors,
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
    // const newAccount = await createAccount({
    //   user_id: newUser.user_id,
    //   account_type: account.account_type,
    //   initial_deposit: account.initial_deposit,
    //   branch_code: account.branch_code,
    //   ifsc_code: account.ifsc_code,
    // });

    // newAccount.status = "pending";
    // await newAccount.save();

    const otpData = await createEmailOtp({
      user_id: newUser.user_id,
      email: newUser.email,
      purpose: "email_verification",
    });

    await notificationService.notifyEmailVerificationOtp(
      newUser,
      otpData.otp
    );

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

    // await logAccountCreation({
    //   user_id: newUser.user_id,
    //   account_id: newAccount.account_id,
    //   ip_address: req.ip,
    //   status: "success",
    //   metadata: {
    //     account_number: newAccount.account_number,
    //   },
    // });

    /**
     * Step 11: Success Response
     */
    return res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email OTP to activate your account.",
      requires_email_verification: true,
      user: {
        user_id: newUser.user_id,
        full_name: newUser.full_name,
        email: newUser.email,
        phone: newUser.phone,
        status: "pending",
      },
      // account: {
      //   account_id: newAccount.account_id,
      //   account_number:
      //     newAccount.account_number,
      //   account_type:
      //     newAccount.account_type,
      //   balance: newAccount.balance,
      //   status: newAccount.status,
      // },
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

async function verifyEmail(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Email is already verified.",
      });
    }

    await verifyEmailOtp({
      email,
      otp,
      purpose: "email_verification",
    });

    const activatedUser = await activateUser(user.user_id);

    await Account.update(
      { status: "active" },
      {
        where: {
          user_id: user.user_id,
          status: "pending",
        },
      }
    );

    const tokens = generateUserTokens(activatedUser);

    await createSession({
      user_id: activatedUser.user_id,
      refresh_token: tokens.refresh_token,
      device_info:
        req.headers["user-agent"] || "Unknown Device",
      ip_address: req.ip,
    });

    setAuthCookies(res, tokens);

    await notificationService.notifyRegister(activatedUser);

    return res.status(200).json({
      success: true,
      message: "Email verified and account activated successfully.",
      user: {
        user_id: activatedUser.user_id,
        full_name: activatedUser.full_name,
        email: activatedUser.email,
        role: activatedUser.role,
        status: activatedUser.status,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function resendEmailVerificationOtp(req, res) {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Email is already verified.",
      });
    }

    const otpData = await createEmailOtp({
      user_id: user.user_id,
      email: user.email,
      purpose: "email_verification",
    });

    await notificationService.notifyEmailVerificationOtp(
      user,
      otpData.otp
    );

    return res.status(200).json({
      success: true,
      message: "Verification OTP sent successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function requestPasswordReset(req, res) {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const user = await getUserByEmail(email);

    if (user && user.status === "active") {
      const otpData = await createEmailOtp({
        user_id: user.user_id,
        email: user.email,
        purpose: "password_reset",
      });

      await notificationService.notifyPasswordResetOtp(
        user,
        otpData.otp
      );
    }

    return res.status(200).json({
      success: true,
      message: "If the email is registered, a password reset OTP has been sent.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to process password reset request.",
    });
  }
}

async function resetPassword(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();
    const newPassword = req.body.new_password;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required.",
      });
    }

    const passwordValidation = validatePassword(newPassword);

    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
      });
    }

    const user = await getUserByEmail(email);

    if (!user || user.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Invalid password reset request.",
      });
    }

    await verifyEmailOtp({
      email,
      otp,
      purpose: "password_reset",
    });

    await updatePassword(user, newPassword);

    await logSecurityEvent({
      user_id: user.user_id,
      action_type: "password_reset",
      entity_id: user.user_id,
      ip_address: req.ip,
      status: "success",
      metadata: {
        email: user.email,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please log in again.",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
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
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);

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
      if (user.status === "pending") {
        return res.status(403).json({
          success: false,
          message:
            "Please verify your email OTP before logging in.",
          requires_email_verification: true,
        });
      }

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
    setAuthCookies(res, tokens);
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

/**
 * Refresh Token Handler
 * POST /auth/refresh
 *
 * Reads the refresh_token from the httpOnly cookie.
 * Validates it against the hashed value stored in the Session table.
 * Issues a new access_token (15m) and rotates the refresh_token (7d).
 * This is called automatically by the frontend when a 401 is received.
 */
async function refreshToken(req, res) {
  try {
    const token = req.cookies?.refresh_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No refresh token provided. Please log in again."
      });
    }

    // Decode without verifying first to get user_id for DB lookup
    const { verifyRefreshToken } = require("../../../shared/utils/tokenUtils");
    const result = verifyRefreshToken(token);

    if (!result.valid) {
      return res.status(401).json({
        success: false,
        message: result.expired
          ? "Session expired. Please log in again."
          : "Invalid refresh token. Please log in again."
      });
    }

    const { user_id, email, role } = result.decoded;

    // Validate against stored session hash
    const session = await getActiveSession(user_id);

    if (!session || !session.is_active) {
      return res.status(401).json({
        success: false,
        message: "Session not found or revoked. Please log in again."
      });
    }

    // Check session expiry
    if (session.expires_at < new Date()) {
      await revokeSession(user_id);
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again."
      });
    }

    // Verify refresh token matches the stored hash
    const tokenMatches = await bcrypt.compare(token, session.refresh_token_hash);
    if (!tokenMatches) {
      // Possible token reuse attack — revoke session immediately
      await revokeSession(user_id);
      return res.status(401).json({
        success: false,
        message: "Invalid session. Please log in again."
      });
    }

    // Issue new tokens (rotate refresh token)
    const newTokens = generateUserTokens({ user_id, email, role });

    // Persist rotated refresh token hash to DB
    await createSession({
      user_id,
      refresh_token: newTokens.refresh_token,
      device_info: req.headers['user-agent'] || 'unknown',
      ip_address: req.ip,
    });

    // Set fresh cookies
    setAuthCookies(res, newTokens);

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully."
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Token refresh failed."
    });
  }
}

/**
 * Logout Handler
 * POST /auth/logout
 *
 * Revokes the server-side session and clears both cookies.
 */
async function logoutUser(req, res) {
  try {
    // If authenticated, revoke the session from DB
    if (req.user?.user_id) {
      await revokeSession(req.user.user_id);
    }

    // Clear cookies server-side (the correct, secure way)
    const cookieOptions = getCookieOptions();
    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully."
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Logout failed."
    });
  }
}

module.exports = {
  registerUser,
  verifyEmail,
  resendEmailVerificationOtp,
  requestPasswordReset,
  resetPassword,
  loginUser,
  refreshToken,
  logoutUser
};
