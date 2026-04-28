// /services/user-service/models/user.model.js

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../shared/config/db");

/**
 * User Model
 * Handles:
 * - Personal details
 * - Authentication credentials
 * - KYC basics
 * - Banking user lifecycle
 */

const User = sequelize.define(
  "User",
  {
    user_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    full_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },

    phone: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
    },

    password_hash: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    transaction_pin_hash: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    dob: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    gender: {
      type: DataTypes.ENUM("male", "female", "other"),
      allowNull: false,
    },

    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    aadhaar_number: {
      type: DataTypes.STRING(12),
      allowNull: false,
      unique: true,
    },

    pan_number: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
    },

    occupation: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    annual_income: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },

    kyc_status: {
      type: DataTypes.ENUM("pending", "verified", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    },

    role: {
      type: DataTypes.ENUM("customer", "admin"),
      allowNull: false,
      defaultValue: "customer",
    },

    status: {
      type: DataTypes.ENUM("pending", "active", "suspended", "closed"),
      allowNull: false,
      defaultValue: "pending",
    },
  },
  {
    tableName: "users",

    timestamps: true,

    createdAt: "created_at",
    updatedAt: "updated_at",

    indexes: [
      {
        unique: true,
        fields: ["email"],
      },
      {
        unique: true,
        fields: ["phone"],
      },
      {
        unique: true,
        fields: ["aadhaar_number"],
      },
      {
        unique: true,
        fields: ["pan_number"],
      },
    ],
  }
);

module.exports = User;