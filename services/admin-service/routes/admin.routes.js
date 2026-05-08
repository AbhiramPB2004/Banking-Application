const express = require("express");

const router = express.Router();

// const {
//   authenticateToken,
//   requireAdmin,
// } = require(
//   "../../../shared/middlewares/securityMiddleware"
// );

const {
  // KYC
  getPendingKYCUsers,
  verifyKYC,
  rejectKYC,

  // Audit Logs
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
} = require(
  "../controllers/adminController"
);

/**
 * Admin-only protection
 */
// router.use(authenticateToken);
// router.use(requireAdmin);

/* =========================================================
   KYC MANAGEMENT
========================================================= */

router.get(
  "/kyc/pending",
  getPendingKYCUsers
);

router.patch(
  "/kyc/verify/:user_id",
  verifyKYC
);

router.patch(
  "/kyc/reject/:user_id",
  rejectKYC
);

/* =========================================================
   AUDIT LOGS
========================================================= */

router.get(
  "/audit-logs",
  getAllAuditLogs
);

router.get(
  "/audit-logs/failures",
  getFailureAuditLogs
);

router.get(
  "/audit-logs/:user_id",
  getUserAuditLogs
);

/* =========================================================
   USER MANAGEMENT
========================================================= */

router.get(
  "/users",
  getAllUsers
);

router.get(
  "/users/:user_id",
  getUserDetails
);

router.patch(
  "/users/suspend/:user_id",
  suspendUser
);

router.patch(
  "/users/activate/:user_id",
  activateUser
);

/* =========================================================
   ACCOUNT MANAGEMENT
========================================================= */

router.get(
  "/accounts",
  getAllAccounts
);

router.patch(
  "/accounts/freeze/:account_id",
  freezeUserAccount
);

router.patch(
  "/accounts/unfreeze/:account_id",
  unfreezeUserAccount
);

module.exports = router;