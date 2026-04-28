// /services/auth-service/models/session.model.js

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../shared/config/db");
const User = require("../../user-service/models/user.model");

/**
 * Session Model
 * Handles:
 * - Single active user session
 * - Refresh token storage
 * - Device/IP tracking
 */

const Session = sequelize.define(
  "Session",
  {
    session_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true, // One active session only
      references: {
        model: User,
        key: "user_id",
      },
      onDelete: "CASCADE",
    },

    refresh_token_hash: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    device_info: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    ip_address: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "sessions",

    timestamps: true,

    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Session;