// services/account-service/services/accountService.js

const User = require("../../user-service/models/user.model");
const Account = require("../models/account.model");
const { sequelize } = require("../../../shared/config/db");

const {
  generateAccountNumber,
} = require("../../../shared/utils/accountNumberGenerator");

/**
 * Create new account
 *
 * Business Rules:
 * - Savings account:
 *   - Minimum opening deposit = ₹1,000 (validated in validator)
 *   - Minimum balance to maintain for transfers = ₹1,000
 *
 * - Current account:
 *   - Minimum opening deposit = ₹5,000
 *   - Minimum balance to maintain for transfers = ₹5,000
 *
 * - Salary account:
 *   - Minimum opening deposit = ₹0
 *   - Minimum balance = ₹0
 *
 * Note:
 * - Withdrawal logic allows full balance withdrawal to ₹0.
 * - Account can be closed when balance becomes ₹0.
 */
async function createAccount({
  user_id,
  account_type,
  initial_deposit,
  branch_code = "0001",
  ifsc_code = "BANK0001",
}) {
  // Normalize safely
  const normalizedType =
    account_type?.toLowerCase()?.trim();

  // -------------------------
  // KYC Verification
  // -------------------------
  const user = await User.findByPk(user_id);

  if (!user) {
    throw new Error("User not found.");
  }

  if (user.kyc_status !== "verified") {
    throw new Error(
      "KYC verification required before account creation."
    );
  }

  // -------------------------
  // Account Count Validation
  // -------------------------
  const existingAccountsCount =
    await Account.count({
      where: {
        user_id,
        account_type: normalizedType,
        status: "active",
      },
    });

  // Only 1 salary account allowed
  if (
    normalizedType === "salary" &&
    existingAccountsCount >= 1
  ) {
    throw new Error(
      "Only one salary account is allowed per user."
    );
  }

  // Max 5 savings/current accounts
  if (
    ["savings", "current"].includes(
      normalizedType
    ) &&
    existingAccountsCount >= 5
  ) {
    throw new Error(
      `Maximum 5 ${normalizedType} accounts allowed per user.`
    );
  }

  // -------------------------
  // Unique Account Number Generation
  // -------------------------
  let account_number;
  let existingAccount;

  do {
    account_number =
      generateAccountNumber(
        "1025",
        branch_code
      );

    existingAccount =
      await Account.findOne({
        where: {
          account_number,
        },
      });
  } while (existingAccount);

  // -------------------------
  // Determine Minimum Balance
  // -------------------------
  let min_balance = 0;

  if (normalizedType === "savings") {
    min_balance = 1000;
  } else if (normalizedType === "current") {
    min_balance = 5000;
  } else if (normalizedType === "salary") {
    min_balance = 0;
  }

  // -------------------------
  // Create Account
  // -------------------------
  return await Account.create({
    user_id,
    account_number,
    account_type: normalizedType,
    branch_code,
    ifsc_code,

    balance: initial_deposit,
    available_balance: initial_deposit,

    // Used for transfer validation
    min_balance,

    initial_deposit,
    status: "active",
  });
}

/**
 * Get account by ID
 */
async function getAccountById(
  account_id,
  user_id
) {
  const account = await Account.findOne({
    where: {
      account_id,
      user_id,
    },
  });

  if (!account) {
    throw new Error(
      "Account not found or unauthorized."
    );
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
      status: "active",
    },
    order: [["created_at", "DESC"]],
  });
}

/**
 * Update balance (credit/debit)
 */
async function updateBalance(
  account_id,
  amount,
  operation
) {
  const transaction =
    await sequelize.transaction();

  try {
    const account =
      await Account.findByPk(account_id, {
        transaction,
      });

    if (!account) {
      throw new Error("Account not found.");
    }

    if (account.status === "closed") {
      throw new Error("Account is closed.");
    }

    if (account.is_frozen) {
      throw new Error("Account is frozen.");
    }

    const current = parseFloat(
      account.balance
    );

    let newBalance =
      operation === "credit"
        ? current + amount
        : current - amount;

    // Fix floating-point precision
    newBalance = parseFloat(
      newBalance.toFixed(2)
    );

    if (
      newBalance <
      parseFloat(account.min_balance)
    ) {
      throw new Error(
        "Minimum balance violation."
      );
    }

    account.balance = newBalance;
    account.available_balance =
      newBalance;

    await account.save({
      transaction,
    });

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
async function closeAccount(
  account_id,
  user_id
) {
  const account = await Account.findOne({
    where: {
      account_id,
      user_id,
    },
  });

  if (!account) {
    throw new Error(
      "Account not found or unauthorized."
    );
  }

  if (account.status === "closed") {
    throw new Error(
      "Account already closed."
    );
  }

  const balance = parseFloat(
    parseFloat(account.balance).toFixed(2)
  );

  if (balance > 0) {
    throw new Error(
      "Account balance must be zero before closure."
    );
  }

  account.status = "closed";
  await account.save();

  return account;
}

/**
 * Update account
 */
async function updateAccount(
  account_id,
  user_id,
  data
) {
  const account = await Account.findOne({
    where: {
      account_id,
      user_id,
    },
  });

  if (!account) {
    throw new Error(
      "Account not found or unauthorized."
    );
  }

  if (account.status === "closed") {
    throw new Error(
      "Cannot update a closed account."
    );
  }

  if (account.is_frozen) {
    throw new Error(
      "Cannot update a frozen account."
    );
  }

  if (data.account_type) {
    const newType =
      data.account_type.toLowerCase();

    const existingAccountsCount =
      await Account.count({
        where: {
          user_id,
          account_type: newType,
          status: "active",
        },
      });

    if (
      newType === "salary" &&
      existingAccountsCount >= 1 &&
      account.account_type !==
        "salary"
    ) {
      throw new Error(
        "Only one salary account is allowed per user."
      );
    }

    if (
      ["savings", "current"].includes(
        newType
      ) &&
      existingAccountsCount >= 5 &&
      account.account_type !== newType
    ) {
      throw new Error(
        `Maximum 5 ${newType} accounts allowed per user.`
      );
    }

    account.account_type = newType;

    // Update min_balance when account type changes
    if (newType === "savings") {
      account.min_balance = 1000;
    } else if (newType === "current") {
      account.min_balance = 5000;
    } else {
      account.min_balance = 0;
    }
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