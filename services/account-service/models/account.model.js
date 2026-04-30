// /services/account-service/models/account.model.js

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../shared/config/db");
const User = require("../../user-service/models/user.model");

/**
 * Account Model
 * Handles:
 * - Bank account details
 * - Balance
 * - Account lifecycle
 */

const Account = sequelize.define(
  "Account",
  {
    account_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: "user_id",
      },
      onDelete: "CASCADE",
    },

    account_number: {
      type: DataTypes.STRING(16),
      allowNull: false,
      unique: true,
    },

    account_type: {
      type: DataTypes.ENUM("savings", "current", "salary"),
      allowNull: false,
    },

    branch_code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "0001",
    },

    ifsc_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "BANK0001",
    },

    balance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },

    available_balance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },

    min_balance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 1000,
    },

    initial_deposit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("pending", "active", "frozen", "closed"),
      allowNull: false,
      defaultValue: "pending",
    },
  },
  {
    tableName: "accounts",

    timestamps: true,

    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Account;