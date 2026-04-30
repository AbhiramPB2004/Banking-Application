// /services/account-service/controllers/account.controller.js

const { sequelize } = require("../../../shared/config/db");

const {
  createAccount,
  getAccountByUserId,
} = require("../services/accountService");
const notificationService = require("../../notification-service/services/notification.service");
const User = require("../../user-service/models/user.model");

/**
 * Create Bank Account Controller
 */
async function createAccountController(req, res) {
  const transaction = await sequelize.transaction();

  try {
    const { user_id, account_type, initial_deposit } = req.body;

    // ---------------------------
    // Step 1: Validate Input
    // ---------------------------
    if (!user_id || !account_type || !initial_deposit) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // ---------------------------
    // Step 2: Create Account
    // ---------------------------
    const newAccount = await createAccount({
      user_id,
      account_type,
      initial_deposit,
    });

    // ---------------------------
    // Step 3: Fetch User (for email)
    // ---------------------------
    const user = await User.findByPk(user_id);

    // ---------------------------
    // Step 4: Send Notification
    // ---------------------------
    await notificationService.sendNotification({
      user_id,
      type: "email",
      recipient: user.email,
      message: "Your bank account has been created successfully.",
    });

    // ---------------------------
    // Step 5: Commit Transaction
    // ---------------------------
    await transaction.commit();

    // ---------------------------
    // Step 6: Response
    // ---------------------------
    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      account: newAccount,
    });

  } catch (error) {
    await transaction.rollback();

    console.error("Account Creation Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create account",
      error: error.message,
    });
  }
}

/**
 * Get Account by User ID
 */
async function getAccountController(req, res) {
  try {
    const { user_id } = req.params;

    const account = await getAccountByUserId(user_id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    return res.json({
      success: true,
      account,
    });

  } catch (error) {
    console.error("Fetch Account Error:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching account",
    });
  }
}

module.exports = {
  createAccountController,
  getAccountController,
};