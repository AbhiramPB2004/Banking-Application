// /services/audit-service/models/auditLog.model.js

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../shared/config/db");
const User = require("../../user-service/models/user.model");

/**
 * Audit Log Model
 * Handles:
 * - Security actions
 * - Registration
 * - Login/logout
 * - Account creation
 * - Compliance tracking
 */

const AuditLog = sequelize.define(
  "AuditLog",
  {
    log_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: User,
        key: "user_id",
      },
      onDelete: "SET NULL",
    },

    action_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    entity_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    entity_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    ip_address: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("success", "failure"),
      allowNull: false,
    },

    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    tableName: "audit_logs",

    timestamps: true,

    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = AuditLog;