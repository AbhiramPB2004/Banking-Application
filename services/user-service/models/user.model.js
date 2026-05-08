// /services/user-service/models/user.model.js

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../shared/config/db");

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
      validate: {
        notNull: {
          msg: "Full name cannot be null.",
        },
        notEmpty: {
          msg: "Full name cannot be empty.",
        },
      },
    },

    email: {
      type: DataTypes.STRING(254),
      allowNull: false,
      unique: true,
      validate: {
        notNull: {
          msg: "Email cannot be null.",
        },
        notEmpty: {
          msg: "Email cannot be empty.",
        },
        isEmail: {
          msg: "Valid email is required.",
        },
        len: {
          args: [5, 254],
          msg: "Email length must be between 5 and 254 characters.",
        },
      },
    },

    phone: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
      validate: {
        notNull: {
          msg: "Phone number cannot be null.",
        },
        notEmpty: {
          msg: "Phone number cannot be empty.",
        },
      },
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
      validate: {
        notNull: {
          msg: "Address cannot be null.",
        },
        notEmpty: {
          msg: "Address cannot be empty.",
        },
      },
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
      validate: {
        notNull: {
          msg: "Occupation cannot be null.",
        },
        notEmpty: {
          msg: "Occupation cannot be empty.",
        },
      },
    },

    annual_income: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        notNull: {
          msg: "Annual income cannot be null.",
        },
      },
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