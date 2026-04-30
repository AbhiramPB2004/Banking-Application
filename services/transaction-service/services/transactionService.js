const Account = require("../../account-service/models/account.model");

/**
 * Transfer Money Logic
 */
async function transferMoney({ sender_account, receiver_account, amount, transaction }) {
  const sender = await Account.findOne({
    where: { account_number: sender_account },
    transaction,
  });

  const receiver = await Account.findOne({
    where: { account_number: receiver_account },
    transaction,
  });

  if (!sender || !receiver) {
    throw new Error("Invalid accounts");
  }

  if (Number(sender.balance) < amount) {
    throw new Error("Insufficient balance");
  }

  // Debit sender
  sender.balance -= amount;
  sender.available_balance -= amount;
  await sender.save({ transaction });

  // Credit receiver
  receiver.balance += amount;
  receiver.available_balance += amount;
  await receiver.save({ transaction });

  return { sender, receiver };
}

module.exports = {
  transferMoney,
};