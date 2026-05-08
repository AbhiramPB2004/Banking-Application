const User = require(
  "../../user-service/models/user.model"
);

const Account = require(
  "../../account-service/models/account.model"
);

const AuditLog = require(
  "../../audit-service/models/auditLog.model"
);

/* =========================================================
   KYC MANAGEMENT
========================================================= */

/**
 * Get all users with pending KYC
 */
async function getPendingUsers() {
  return await User.findAll({
    where: {
      kyc_status: "pending",
    },
    order: [["created_at", "DESC"]],
  });
}

/**
 * Verify user KYC
 */
async function verifyUserKYC(
  user_id
) {
  const user =
    await User.findByPk(user_id);

  if (!user) {
    throw new Error(
      "User not found."
    );
  }

  user.kyc_status = "verified";

  await user.save();

  return user;
}

/**
 * Reject user KYC
 */
async function rejectUserKYC(
  user_id
) {
  const user =
    await User.findByPk(user_id);

  if (!user) {
    throw new Error(
      "User not found."
    );
  }

  user.kyc_status = "rejected";

  await user.save();

  return user;
}

/* =========================================================
   AUDIT LOGS
========================================================= */

/**
 * Fetch all audit logs
 */
async function fetchAllAuditLogs() {
  return await AuditLog.findAll({
    order: [["created_at", "DESC"]],
  });
}

/**
 * Fetch logs for a specific user
 */
async function fetchUserAuditLogs(
  user_id
) {
  return await AuditLog.findAll({
    where: {
      user_id,
    },
    order: [["created_at", "DESC"]],
  });
}

/**
 * Fetch failed audit logs
 */
async function fetchFailureAuditLogs() {
  return await AuditLog.findAll({
    where: {
      status: "failure",
    },
    order: [["created_at", "DESC"]],
  });
}

/* =========================================================
   USER MANAGEMENT
========================================================= */

/**
 * Get all users
 */
async function fetchAllUsers() {
  return await User.findAll({
    order: [["created_at", "DESC"]],
  });
}

/**
 * Get user by ID
 */
async function fetchUserById(
  user_id
) {
  const user =
    await User.findByPk(user_id);

  if (!user) {
    throw new Error(
      "User not found."
    );
  }

  return user;
}

/**
 * Suspend user
 */
async function suspendExistingUser(
  user_id
) {
  const user =
    await User.findByPk(user_id);

  if (!user) {
    throw new Error(
      "User not found."
    );
  }

  user.status = "suspended";

  await user.save();

  return user;
}

/**
 * Activate user
 */
async function activateExistingUser(
  user_id
) {
  const user =
    await User.findByPk(user_id);

  if (!user) {
    throw new Error(
      "User not found."
    );
  }

  user.status = "active";

  await user.save();

  return user;
}

/* =========================================================
   ACCOUNT MANAGEMENT
========================================================= */

/**
 * Get all accounts
 */
async function fetchAllAccounts() {
  return await Account.findAll({
    order: [["created_at", "DESC"]],
  });
}

/**
 * Freeze account
 */
async function freezeExistingAccount(
  account_id
) {
  const account =
    await Account.findByPk(
      account_id
    );

  if (!account) {
    throw new Error(
      "Account not found."
    );
  }

  account.is_frozen = true;

  await account.save();

  return account;
}

/**
 * Unfreeze account
 */
async function unfreezeExistingAccount(
  account_id
) {
  const account =
    await Account.findByPk(
      account_id
    );

  if (!account) {
    throw new Error(
      "Account not found."
    );
  }

  account.is_frozen = false;

  await account.save();

  return account;
}

module.exports = {
  // KYC
  getPendingUsers,
  verifyUserKYC,
  rejectUserKYC,

  // Audit Logs
  fetchAllAuditLogs,
  fetchUserAuditLogs,
  fetchFailureAuditLogs,

  // Users
  fetchAllUsers,
  fetchUserById,
  suspendExistingUser,
  activateExistingUser,

  // Accounts
  fetchAllAccounts,
  freezeExistingAccount,
  unfreezeExistingAccount,
};