const Account = require("../models/account.model");
const { sequelize } = require("../../../shared/config/db");

const { generateAccountNumber } = require("../../../shared/utils/accountNumberGenerator");

/**
 * Create new account
 */
async function createAccount({
  user_id,
  account_type,
  initial_deposit,
  branch_code = "0001",
  ifsc_code = "BANK0001",
}) {
  let account_number;
  let existingAccount;

  do {
    account_number = generateAccountNumber("1025", branch_code);

    existingAccount = await Account.findOne({
      where: { account_number },
    });
  } while (existingAccount);

  return await Account.create({
    user_id,
    account_number,
    account_type: account_type.toLowerCase(),
    branch_code,
    ifsc_code,

    // ✅ MATCHES YOUR DB STRUCTURE
    balance: initial_deposit,
    available_balance: initial_deposit,
    min_balance: 1000,

    initial_deposit,
    status: "active",
  });
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
 * Get all ACTIVE user accounts
 */
async function getAccountsByUserId(user_id) {
  return await Account.findAll({
    where: {
      user_id,
      status: "active", // 🔥 hides closed accounts
    },
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

    if (account.status === "closed") {
      throw new Error("Account is closed.");
    }

    if (account.is_frozen) {
      throw new Error("Account is frozen.");
    }

    const current = parseFloat(account.balance);

    let newBalance =
      operation === "credit"
        ? current + amount
        : current - amount;

    if (newBalance < parseFloat(account.min_balance)) {
      throw new Error("Minimum balance violation.");
    }

    account.balance = newBalance;
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
 * Close account
 */
async function closeAccount(account_id, user_id) {
  const account = await Account.findOne({
    where: { account_id, user_id },
  });

  if (!account) {
    throw new Error("Account not found or unauthorized.");
  }

  if (account.status === "closed") {
    throw new Error("Account already closed.");
  }

  // 🔥 CRITICAL FIX
  const balance = parseFloat(account.balance);

  if (balance > 0) {
    throw new Error("Account balance must be zero before closure.");
  }

  account.status = "closed";
  await account.save();

  return account;
}

/**
 * Update account
 */
async function updateAccount(account_id, user_id, data) {
  const account = await Account.findOne({
    where: { account_id, user_id },
  });

  if (!account) {
    throw new Error("Account not found or unauthorized.");
  }

  if (account.status === "closed") {
    throw new Error("Cannot update a closed account.");
  }

  if (account.is_frozen) {
    throw new Error("Cannot update a frozen account.");
  }

  if (data.account_type) {
    account.account_type = data.account_type.toLowerCase();
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