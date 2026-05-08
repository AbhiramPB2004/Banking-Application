// /services/investment-service/models/portfolio.model.js

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../shared/config/db");
const User = require("../../user-service/models/user.model");

const Portfolio = sequelize.define(
  "Portfolio",
  {
    portfolio_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: User,
        key: "user_id",
      },
      onDelete: "CASCADE",
    },

    risk_profile: {
      type: DataTypes.ENUM("low", "medium", "high"),
      allowNull: false,
      defaultValue: "low",
    },

    total_invested: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },

    current_value: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },

    total_returns: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "portfolios",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

Portfolio.belongsTo(User, { foreignKey: "user_id", as: "user" });

module.exports = Portfolio;
