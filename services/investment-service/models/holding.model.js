// /services/investment-service/models/holding.model.js

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../shared/config/db");
const Portfolio = require("./portfolio.model");
const InvestmentProduct = require("./investmentProduct.model");

const Holding = sequelize.define(
  "Holding",
  {
    holding_id: {
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

    units: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: false,
      defaultValue: 0,
    },

    average_nav: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
      defaultValue: 0,
    },

    invested_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },

    current_value: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "investment_holdings",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["portfolio_id", "product_id"],
      },
    ],
  }
);

Portfolio.hasMany(Holding, { foreignKey: "portfolio_id", as: "holdings" });
Holding.belongsTo(Portfolio, { foreignKey: "portfolio_id", as: "portfolio" });
Holding.belongsTo(InvestmentProduct, { foreignKey: "product_id", as: "product" });
InvestmentProduct.hasMany(Holding, { foreignKey: "product_id", as: "holdings" });

module.exports = Holding;
