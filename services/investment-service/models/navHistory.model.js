// /services/investment-service/models/navHistory.model.js

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../shared/config/db");
const InvestmentProduct = require("./investmentProduct.model");

const NavHistory = sequelize.define(
  "NavHistory",
  {
    nav_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: InvestmentProduct,
        key: "product_id",
      },
      onDelete: "CASCADE",
    },

    nav_value: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
    },

    nav_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    tableName: "nav_history",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["product_id", "nav_date"],
      },
    ],
  }
);

InvestmentProduct.hasMany(NavHistory, { foreignKey: "product_id", as: "nav_history" });
NavHistory.belongsTo(InvestmentProduct, { foreignKey: "product_id", as: "product" });

module.exports = NavHistory;
