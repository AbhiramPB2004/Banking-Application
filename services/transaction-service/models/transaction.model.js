const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../shared/config/db");

const Transaction = sequelize.define(
  "Transaction",
  {
    transaction_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    from_account_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    to_account_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },

   transaction_type: {
  type: DataTypes.ENUM(
    "deposit",
    "withdraw",
    "internal",
    "imps",
    "neft",
    "rtgs"
  )
},

    status: {
      type: DataTypes.ENUM("pending", "success", "failed"),
      defaultValue: "success",
    },

    reference_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: "transactions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = Transaction;