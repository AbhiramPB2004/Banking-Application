// /services/investment-service/models/investmentProduct.model.js

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../shared/config/db");

const InvestmentProduct = sequelize.define(
  "InvestmentProduct",
  {
    product_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    product_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    investment_type: {
      type: DataTypes.ENUM("mutual_fund", "equity", "bond", "gold"),
      allowNull: false,
    },

    risk_level: {
      type: DataTypes.ENUM("low", "medium", "high"),
      allowNull: false,
    },

    nav_value: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
    },

    minimum_investment: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 500,
    },

    expense_ratio: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },

    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    },
  },
  {
    tableName: "investment_products",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["investment_type"] },
      { fields: ["risk_level"] },
      { fields: ["status"] },
    ],
  }
);

module.exports = InvestmentProduct;
