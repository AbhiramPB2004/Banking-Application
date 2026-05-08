const Account = require("../models/account.model");
const { sequelize } = require("../../../shared/config/db");

const { generateAccountNumber } = require("../../../shared/utils/accountNumberGenerator");
const {
  logAccountCreation,
  logAccountUpdate,
  logAccountClosure,
} = require("../../audit-service/services/auditService");
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

  try {

  const account = await Account.create({
    user_id,
    account_number,
    account_type: account_type.toLowerCase(),
    branch_code,
    ifsc_code,

    balance: initial_deposit,
    available_balance: initial_deposit,
    min_balance: 1000,

    initial_deposit,
    status: "active",
  });



  // ✅ ACCOUNT CREATION SUCCESS AUDIT
  await logAccountCreation({
    user_id,
    account_id: account.account_id,
    ip_address: null,

    status: "success",

    metadata: {
      account_number: account.account_number,
      account_type: account.account_type,
      initial_deposit,
    },
  });



  return account;

} catch (error) {



  // ❌ ACCOUNT CREATION FAILURE AUDIT
  await logAccountCreation({
    user_id,
    account_id: null,
    ip_address: null,

    status: "failure",

    metadata: {
      error: error.message,
      account_type,
    },
  });



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

  try {

  account.status = "closed";

  await account.save();



  // ✅ ACCOUNT CLOSURE SUCCESS AUDIT
  await logAccountClosure({
    user_id,
    account_id: account.account_id,
    ip_address: null,

    status: "success",

    metadata: {
      account_number: account.account_number,
      remaining_balance: account.balance,
    },
  });



  return account;

} catch(error) {



  // ❌ ACCOUNT CLOSURE FAILURE AUDIT
  await logAccountClosure({
    user_id,
    account_id,
    ip_address: null,

    status: "failure",

    metadata: {
      error: error.message,
    },
  });



  throw error;
}
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

  try {

  if (data.account_type) {
    account.account_type = data.account_type.toLowerCase();
  }

  await account.save();



  // ✅ ACCOUNT UPDATE SUCCESS AUDIT
  await logAccountUpdate({
    user_id,
    account_id: account.account_id,
    ip_address: null,

    status: "success",

    metadata: {
      updated_fields: data,
      account_type: account.account_type,
    },
  });



  return account;

} catch(error) {



  // ❌ ACCOUNT UPDATE FAILURE AUDIT
  await logAccountUpdate({
    user_id,
    account_id,
    ip_address: null,

    status: "failure",

    metadata: {
      error: error.message,
    },
  });



  throw error;
}
}

module.exports = {
  createAccount,
  getAccountById,
  getAccountsByUserId,
  updateBalance,
  closeAccount,
  updateAccount,
};