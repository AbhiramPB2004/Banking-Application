const User = require("../../services/user-service/models/user.model");

const {
  compareTransactionPin,
} = require("../security/transactionPinPolicy");

async function verifyTransactionPin(req, res, next) {
  try {
    const { transaction_pin } = req.body;

    if (!transaction_pin) {
      return res.status(400).json({
        success: false,
        message: "Transaction PIN is required",
      });
    }

    const user = await User.findByPk(req.user.user_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isValid = await compareTransactionPin(
      transaction_pin,
      user.transaction_pin_hash
    );

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid transaction PIN",
      });
    }

    next();

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "PIN verification failed",
    });
  }
}

module.exports = verifyTransactionPin;