// /services/investment-service/models/investmentTransaction.model.js

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../shared/config/db");
const Portfolio = require("./portfolio.model");
const InvestmentProduct = require("./investmentProduct.model");
const Account = require("../../account-service/models/account.model");

const InvestmentTransaction = sequelize.define(
  "InvestmentTransaction",
  {
    transaction_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    portfolio_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Portfolio,
        key: "portfolio_id",
      },
      onDelete: "CASCADE",
    },

    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: InvestmentProduct,
        key: "product_id",
      },
      onDelete: "RESTRICT",
    },

    source_account_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Account,
        key: "account_id",
      },
      onDelete: "RESTRICT",
    },

    transaction_type: {
      type: DataTypes.ENUM("buy", "sell"),
      allowNull: false,
    },

    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },

    units: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: false,
    },

    nav_at_execution: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("success", "failed"),
      allowNull: false,
      defaultValue: "success",
    },
  },
  {
    tableName: "investment_transactions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["portfolio_id"] },
      { fields: ["product_id"] },
      { fields: ["transaction_type"] },
    ],
  }
);

Portfolio.hasMany(InvestmentTransaction, {
  foreignKey: "portfolio_id",
  as: "investment_transactions",
});
InvestmentTransaction.belongsTo(Portfolio, {
  foreignKey: "portfolio_id",
  as: "portfolio",
});
InvestmentTransaction.belongsTo(InvestmentProduct, {
  foreignKey: "product_id",
  as: "product",
});

module.exports = InvestmentTransaction;
