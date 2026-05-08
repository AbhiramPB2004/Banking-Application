const {
  // KYC
  getPendingUsers,
  verifyUserKYC,
  rejectUserKYC,

  // Audit
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
} = require("../services/adminService");

/* =========================================================
   KYC
========================================================= */

async function getPendingKYCUsers(
  req,
  res
) {
  try {
    const users =
      await getPendingUsers();

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function verifyKYC(
  req,
  res
) {
  try {
    const { user_id } =
      req.params;

    const user =
      await verifyUserKYC(
        user_id
      );

    return res.status(200).json({
      success: true,
      message:
        "KYC verified successfully.",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function rejectKYC(
  req,
  res
) {
  try {
    const { user_id } =
      req.params;

    const user =
      await rejectUserKYC(
        user_id
      );

    return res.status(200).json({
      success: true,
      message:
        "KYC rejected successfully.",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/* =========================================================
   AUDIT LOGS
========================================================= */

async function getAllAuditLogs(
  req,
  res
) {
  try {
    const logs =
      await fetchAllAuditLogs();

    return res.status(200).json({
      success: true,
      logs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getUserAuditLogs(
  req,
  res
) {
  try {
    const { user_id } =
      req.params;

    const logs =
      await fetchUserAuditLogs(
        user_id
      );

    return res.status(200).json({
      success: true,
      logs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getFailureAuditLogs(
  req,
  res
) {
  try {
    const logs =
      await fetchFailureAuditLogs();

    return res.status(200).json({
      success: true,
      logs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/* =========================================================
   USERS
========================================================= */

async function getAllUsers(
  req,
  res
) {
  try {
    const users =
      await fetchAllUsers();

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getUserDetails(
  req,
  res
) {
  try {
    const { user_id } =
      req.params;

    const user =
      await fetchUserById(
        user_id
      );

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function suspendUser(
  req,
  res
) {
  try {
    const { user_id } =
      req.params;

    const user =
      await suspendExistingUser(
        user_id
      );

    return res.status(200).json({
      success: true,
      message:
        "User suspended successfully.",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function activateUser(
  req,
  res
) {
  try {
    const { user_id } =
      req.params;

    const user =
      await activateExistingUser(
        user_id
      );

    return res.status(200).json({
      success: true,
      message:
        "User activated successfully.",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/* =========================================================
   ACCOUNTS
========================================================= */

async function getAllAccounts(
  req,
  res
) {
  try {
    const accounts =
      await fetchAllAccounts();

    return res.status(200).json({
      success: true,
      accounts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function freezeUserAccount(
  req,
  res
) {
  try {
    const { account_id } =
      req.params;

    const account =
      await freezeExistingAccount(
        account_id
      );

    return res.status(200).json({
      success: true,
      message:
        "Account frozen successfully.",
      account,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function unfreezeUserAccount(
  req,
  res
) {
  try {
    const { account_id } =
      req.params;

    const account =
      await unfreezeExistingAccount(
        account_id
      );

    return res.status(200).json({
      success: true,
      message:
        "Account unfrozen successfully.",
      account,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  // KYC
  getPendingKYCUsers,
  verifyKYC,
  rejectKYC,

  // Audit
  getAllAuditLogs,
  getUserAuditLogs,
  getFailureAuditLogs,

  // Users
  getAllUsers,
  getUserDetails,
  suspendUser,
  activateUser,

  // Accounts
  getAllAccounts,
  freezeUserAccount,
  unfreezeUserAccount,
};