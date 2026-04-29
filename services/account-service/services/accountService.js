const Account = require("../models/account.model");
const { sequelize } = require("../../../shared/config/db");

/**
 * Generate account number (simple version for now)
 */
function generateAccountNumber() {
  return "ACC" + Date.now();
}

/**
 * Create new account
 */
async function createAccount(user_id, data) {
  const transaction = await sequelize.transaction();

  try {
    const account = await Account.create(
      {
        user_id,
        account_number: generateAccountNumber(),
        account_type: data.account_type,
        current_balance: data.initial_deposit,
        available_balance: data.initial_deposit,
      },
      { transaction }
    );

    await transaction.commit();
    return account;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Get account by ID
 */
async function getAccountById(account_id, user_id) {
  const account = await Account.findOne({
    where: { account_id, user_id },
  });

  if (!account) {
    throw new Error("Account not found or unauthorized.");
  }

  return account;
}

/**
 * Get all user accounts
 */
async function getAccountsByUserId(user_id) {
  return await Account.findAll({
    where: { user_id },
  });
}

/**
 * Update balance (credit/debit)
 */
async function updateBalance(account_id, amount, operation) {
  const transaction = await sequelize.transaction();

  try {
    const account = await Account.findByPk(account_id, { transaction });

    if (!account) throw new Error("Account not found.");
    if (account.is_frozen) throw new Error("Account is frozen.");

    let newBalance =
      operation === "credit"
        ? parseFloat(account.current_balance) + amount
        : parseFloat(account.current_balance) - amount;

    if (newBalance < account.minimum_balance) {
      throw new Error("Minimum balance violation.");
    }

    account.current_balance = newBalance;
    account.available_balance = newBalance;

    await account.save({ transaction });

    await transaction.commit();
    return account;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Update account status (close account)
 */
async function closeAccount(account_id, user_id) {
  const account = await Account.findOne({
    where: { account_id, user_id },
  });

  if (!account) {
    throw new Error("Account not found or unauthorized.");
  }

  if (account.current_balance > 0) {
    throw new Error("Account balance must be zero before closure.");
  }

  account.status = "closed";
  await account.save();

  return account;
}

/**
 * Update account type (optional)
 */
async function updateAccount(account_id, user_id, data) {
  const account = await Account.findOne({
    where: { account_id, user_id },
  });

  if (!account) {
    throw new Error("Account not found or unauthorized.");
  }

  if (account.is_frozen) {
    throw new Error("Cannot update a frozen account.");
  }

  // Only allow safe updates
  if (data.account_type) {
    account.account_type = data.account_type;
  }

  await account.save();

  return account;
}

module.exports = {
  createAccount,
  getAccountById,
  getAccountsByUserId,
  updateBalance,
  closeAccount,
  updateAccount,
};