const { sequelize } = require("../../../shared/config/db");

const {
  transferMoney,
} = require("../services/transactionService");

const notificationService = require("../../notification-service/services/notification.service");
const User = require("../../user-service/models/user.model");

/**
 * Transfer Money Controller
 */
async function transferController(req, res) {
  const transaction = await sequelize.transaction();

  try {
    const { sender_account, receiver_account, amount } = req.body;

    // ---------------------------
    // Step 0: Basic Validation
    // ---------------------------
    if (!sender_account || !receiver_account || !amount) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // ---------------------------
    // Step 1: Perform Transfer
    // ---------------------------
    const result = await transferMoney({
      sender_account,
      receiver_account,
      amount,
      transaction, // ✅ IMPORTANT
    });

    const { sender, receiver } = result;

    // ---------------------------
    // Step 2: Fetch Users
    // ---------------------------
    const senderUser = await User.findByPk(sender.user_id);
    const receiverUser = await User.findByPk(receiver.user_id);

    // ✅ DEBUG FIRST
    console.log("Sender User:", senderUser);
    console.log("Receiver User:", receiverUser);

    // ---------------------------
    // Step 3: Validate Users
    // ---------------------------
    if (!senderUser || !receiverUser) {
      throw new Error("User not found for transaction");
    }

    // ---------------------------
    // Step 4: Debit Notification
    // ---------------------------
    await notificationService.sendNotification({
      user_id: sender.user_id,
      type: "email",
      recipient: senderUser.email,
      message: `${amount} INR debited from your account.`,
    });

    // ---------------------------
    // Step 5: Credit Notification
    // ---------------------------
    await notificationService.sendNotification({
      user_id: receiver.user_id,
      type: "email",
      recipient: receiverUser.email,
      message: `${amount} INR credited to your account.`,
    });

    // ---------------------------
    // Step 6: Commit Transaction
    // ---------------------------
    await transaction.commit();

    return res.json({
      success: true,
      message: "Transaction successful",
    });

  } catch (error) {
    await transaction.rollback();

    console.error("Transaction Error:", error);

    return res.status(500).json({
      success: false,
      message: "Transaction failed",
      error: error.message,
    });
  }
}

module.exports = {
  transferController,
};