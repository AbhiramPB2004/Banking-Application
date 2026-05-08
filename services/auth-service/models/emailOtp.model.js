// /services/auth-service/models/emailOtp.model.js

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../shared/config/db");
const User = require("../../user-service/models/user.model");

const EmailOtp = sequelize.define(
  "EmailOtp",
  {
    otp_id: {
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

    email: {
      type: DataTypes.STRING(254),
      allowNull: false,
    },

    purpose: {
      type: DataTypes.ENUM("email_verification", "password_reset"),
      allowNull: false,
    },

    otp_hash: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    consumed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    status: {
      type: DataTypes.ENUM("active", "consumed", "expired"),
      allowNull: false,
      defaultValue: "active",
    },
  },
  {
    tableName: "email_otps",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["email", "purpose", "status"] },
      { fields: ["user_id", "purpose", "status"] },
    ],
  }
);

EmailOtp.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(EmailOtp, { foreignKey: "user_id", as: "email_otps" });

module.exports = EmailOtp;
