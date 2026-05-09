// /services/payment-tracking-service/models/paymentTracking.model.js

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../shared/config/db");
const User = require("../../user-service/models/user.model");

/**
 * PaymentTracking Model
 * Tracks all payment-related activities across different services.
 */
const PaymentTracking = sequelize.define(
  "PaymentTracking",
  {
    payment_tracking_id: {
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

    payment_type: {
      type: DataTypes.ENUM("CREDIT_CARD", "LOAN", "TRANSFER", "BILL", "EMI"),
      allowNull: false,
    },

    transaction_type: {
      type: DataTypes.ENUM("PURCHASE", "PAYMENT", "REFUND", "EMI", "REVERSAL"),
      allowNull: true,
      defaultValue: "PAYMENT"
    },

    merchant_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: "General"
    },

    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },

    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: "INR",
    },

    status: {
      type: DataTypes.ENUM("SUCCESS", "FAILED", "PENDING"),
      allowNull: false,
      defaultValue: "PENDING",
    },

    payment_method: {
      type: DataTypes.ENUM("BANK_TRANSFER", "CARD", "UPI", "NET_BANKING"),
      allowNull: false,
    },

    reference_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },

    related_entity_id: {
      type: DataTypes.STRING(100), // Can be loan_id, card_id, etc.
      allowNull: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "payment_tracking",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        fields: ["user_id"],
      },
      {
        fields: ["payment_type"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["reference_id"],
      },
      {
        fields: ["related_entity_id"],
      },
    ],
  }
);

// Associations
PaymentTracking.belongsTo(User, { foreignKey: "user_id", as: "user" });

module.exports = PaymentTracking;
