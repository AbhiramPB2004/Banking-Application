const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../shared/config/db"); // ✅ correct

const FD = sequelize.define(
  "FD",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    account_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    principal_amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    interest_rate: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    tenure_months: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    maturity_amount: {
      type: DataTypes.FLOAT,
    },
    status: {
      type: DataTypes.ENUM("ACTIVE", "MATURED", "CLOSED"),
      defaultValue: "ACTIVE",
    },
    start_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    maturity_date: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: "fds",
    timestamps: true,
  }
);

module.exports = FD;