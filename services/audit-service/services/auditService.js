// /services/audit-service/services/auditService.js

const AuditLog = require("../models/auditLog.model");

/**
 * Create audit log entry
 */
async function createAuditLog({
  user_id = null,
  action_type,
  entity_type,
  entity_id = null,
  ip_address = null,
  status,
  metadata = {},
}) {
  return await AuditLog.create({
    user_id,
    action_type,
    entity_type,
    entity_id,
    ip_address,
    status,
    metadata,
  });
}

/**
 * Get audit logs by user
 */
async function getUserAuditLogs(user_id) {
  return await AuditLog.findAll({
    where: { user_id },
    order: [["created_at", "DESC"]],
  });
}

/**
 * Get all audit logs
 * Admin use
 */
async function getAllAuditLogs() {
  return await AuditLog.findAll({
    order: [["created_at", "DESC"]],
  });
}

/**
 * Log registration event
 */
async function logRegistration({
  user_id,
  ip_address,
  status,
  metadata = {},
}) {
  return await createAuditLog({
    user_id,
    action_type: "registration",
    entity_type: "user",
    entity_id: user_id,
    ip_address,
    status,
    metadata,
  });
}

/**
 * Log login event
 */
async function logLogin({
  user_id,
  ip_address,
  status,
  metadata = {},
}) {
  return await createAuditLog({
    user_id,
    action_type: "login",
    entity_type: "auth",
    entity_id: user_id,
    ip_address,
    status,
    metadata,
  });
}

/**
 * Log failed login / suspicious activity
 *
 * Handles:
 * - Invalid password attempts
 * - Unknown user login attempts
 * - Fraud/security investigations
 */
async function logSecurityEvent({
  user_id = null,
  action_type,
  entity_type = "auth",
  entity_id = null,
  ip_address = null,
  status,
  metadata = {},
}) {
  return await createAuditLog({
    user_id,
    action_type,
    entity_type,
    entity_id,
    ip_address,
    status,
    metadata,
  });
}

/**
 * Log account creation event
 */
async function logAccountCreation({
  user_id,
  account_id,
  ip_address,
  status,
  metadata = {},
}) {
  return await createAuditLog({
    user_id,
    action_type: "account_creation",
    entity_type: "account",
    entity_id: account_id,
    ip_address,
    status,
    metadata,
  });
}

/**
 * Log transaction events
 */
async function logTransaction({
  user_id,
  transaction_id = null,
  action_type,
  ip_address = null,
  status,
  metadata = {},
}) {
  return await createAuditLog({
    user_id,
    action_type,
    entity_type: "transaction",
    entity_id: transaction_id,
    ip_address,
    status,
    metadata,
  });
}
/**
 * Log account update event
 */
async function logAccountUpdate({
  user_id,
  account_id,
  ip_address,
  status,
  metadata = {},
}) {
  return await createAuditLog({
    user_id,
    action_type: "account_update",
    entity_type: "account",
    entity_id: account_id,
    ip_address,
    status,
    metadata,
  });
}

/**
 * Log account freeze event
 */
async function logAccountFreeze({
  user_id,
  account_id,
  ip_address,
  status,
  metadata = {},
}) {
  return await createAuditLog({
    user_id,
    action_type: "account_freeze",
    entity_type: "account",
    entity_id: account_id,
    ip_address,
    status,
    metadata,
  });
}

/**
 * Log account unfreeze event
 */
async function logAccountUnfreeze({
  user_id,
  account_id,
  ip_address,
  status,
  metadata = {},
}) {
  return await createAuditLog({
    user_id,
    action_type: "account_unfreeze",
    entity_type: "account",
    entity_id: account_id,
    ip_address,
    status,
    metadata,
  });
}

/**
 * Log account closure event
 */
async function logAccountClosure({
  user_id,
  account_id,
  ip_address,
  status,
  metadata = {},
}) {
  return await createAuditLog({
    user_id,
    action_type: "account_closure",
    entity_type: "account",
    entity_id: account_id,
    ip_address,
    status,
    metadata,
  });
}
/**
 * Log loan application
 */
async function logLoanApplication({
  user_id,
  loan_id = null,
  ip_address = null,
  status,
  metadata = {},
}) {
  return await createAuditLog({
    user_id,
    action_type: "loan_application",
    entity_type: "loan",
    entity_id: loan_id,
    ip_address,
    status,
    metadata,
  });
}

/**
 * Log loan approval
 */
async function logLoanApproval({
  user_id,
  loan_id,
  ip_address = null,
  status,
  metadata = {},
}) {
  return await createAuditLog({
    user_id,
    action_type: "loan_approval",
    entity_type: "loan",
    entity_id: loan_id,
    ip_address,
    status,
    metadata,
  });
}

/**
 * Log loan rejection
 */
async function logLoanRejection({
  user_id,
  loan_id,
  ip_address = null,
  status,
  metadata = {},
}) {
  return await createAuditLog({
    user_id,
    action_type: "loan_rejection",
    entity_type: "loan",
    entity_id: loan_id,
    ip_address,
    status,
    metadata,
  });
}

/**
 * Log loan repayment
 */
async function logLoanRepayment({
  user_id,
  loan_id,
  ip_address = null,
  status,
  metadata = {},
}) {
  return await createAuditLog({
    user_id,
    action_type: "loan_repayment",
    entity_type: "loan",
    entity_id: loan_id,
    ip_address,
    status,
    metadata,
  });
}
module.exports = {
  createAuditLog,
  getUserAuditLogs,
  getAllAuditLogs,
  logRegistration,
  logLogin,
  logSecurityEvent,
  logAccountCreation,
  logTransaction,
  logAccountUpdate,
  logAccountFreeze,
  logAccountUnfreeze,
  logAccountClosure,
  logLoanApplication,
  logLoanApproval,
  logLoanRejection,
  logLoanRepayment,
};