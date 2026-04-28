// /services/account-service/services/accountService.js

const Account = require("../models/account.model");
const {
  generateAccountNumber,
} = require("../../../shared/utils/accountNumberGenerator");

/**
 * Create new bank account for user
 */
async function createAccount({
  user_id,
  account_type,
  initial_deposit,
  branch_code = "0001",
  ifsc_code = "BANK0001",
}) {
  // Generate unique account number
  let account_number;
  let existingAccount;

  do {
    account_number = generateAccountNumber("1025", branch_code);

    existingAccount = await Account.findOne({
      where: { account_number },
    });
  } while (existingAccount);

  // Create account
  const newAccount = await Account.create({
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

  return newAccount;
}

/**
 * Get account by user ID
 */
async function getAccountByUserId(user_id) {
  return await Account.findOne({
    where: { user_id },
  });
}

/**
 * Get account by account number
 */
async function getAccountByNumber(account_number) {
  return await Account.findOne({
    where: { account_number },
  });
}

/**
 * Update account balance
 */
async function updateBalance(account_id, newBalance) {
  const account = await Account.findByPk(account_id);

  if (!account) {
    throw new Error("Account not found.");
  }

  account.balance = newBalance;
  account.available_balance = newBalance;

  await account.save();

  return account;
}

/**
 * Freeze account
 */
async function freezeAccount(account_id) {
  const account = await Account.findByPk(account_id);

  if (!account) {
    throw new Error("Account not found.");
  }

  account.status = "frozen";

  await account.save();

  return account;
}

module.exports = {
  createAccount,
  getAccountByUserId,
  getAccountByNumber,
  updateBalance,
  freezeAccount,
};