const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../shared/config/db");

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
    },

    account_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    account_type: {
      type: DataTypes.ENUM("savings", "current", "salary"),
      allowNull: false,
    },

    branch_code: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "BR001",
    },

    ifsc_code: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "BANK0001234",
    },

    current_balance: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    available_balance: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    minimum_balance: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 1000,
    },

    status: {
      type: DataTypes.ENUM("active", "inactive", "closed"),
      defaultValue: "active",
    },

    is_frozen: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "accounts",
    timestamps: true,
  }
);

module.exports = Account;