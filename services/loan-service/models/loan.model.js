// /services/loan-service/models/loan.model.js

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../shared/config/db");
const User = require("../../user-service/models/user.model");
const Account = require("../../account-service/models/account.model");

/**
 * Loan Model
 * Handles:
 * - Loan contract details
 * - Approval workflow state
 * - Outstanding balance tracking
 * - Loan lifecycle management
 */

const Loan = sequelize.define(
  "Loan",
  {
    loan_id: {
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

    linked_account_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Account,
        key: "account_id",
      },
      onDelete: "RESTRICT",
    },

    loan_type: {
      type: DataTypes.ENUM("personal", "home", "vehicle", "education"),
      allowNull: false,
    },

    principal_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },

    approved_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },

    interest_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },

    tenure_months: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    monthly_emi: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },

    total_payable: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },

    outstanding_balance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },

    next_due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    loan_status: {
      type: DataTypes.ENUM("active", "closed", "defaulted", "foreclosed"),
      allowNull: false,
      defaultValue: "active",
    },

    approval_status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    },

    credit_score: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    risk_category: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    issued_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    closed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "loans",

    timestamps: true,

    createdAt: "created_at",
    updatedAt: "updated_at",

    indexes: [
      {
        fields: ["user_id"],
      },
      {
        fields: ["loan_status"],
      },
      {
        fields: ["approval_status"],
      },
    ],
  }
);

// ─── EMI SCHEDULE MODEL ───────────────────────────────────────────────────────

/**
 * EMI Schedule Model
 * Handles:
 * - Per-installment schedule
 * - Payment tracking per EMI
 * - Due date management
 */

const EMISchedule = sequelize.define(
  "EMISchedule",
  {
    schedule_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    loan_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Loan,
        key: "loan_id",
      },
      onDelete: "CASCADE",
    },

    installment_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    emi_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },

    principal_component: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },

    interest_component: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },

    outstanding_after: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("upcoming", "paid", "overdue", "partial"),
      allowNull: false,
      defaultValue: "upcoming",
    },

    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "emi_schedules",

    timestamps: true,

    createdAt: "created_at",
    updatedAt: "updated_at",

    indexes: [
      {
        fields: ["loan_id"],
      },
      {
        fields: ["due_date"],
      },
      {
        fields: ["status"],
      },
    ],
  }
);

// ─── REPAYMENT HISTORY MODEL ─────────────────────────────────────────────────

/**
 * Repayment History Model
 * Handles:
 * - Actual payment records
 * - Payment type classification
 * - Source account tracking
 */

const RepaymentHistory = sequelize.define(
  "RepaymentHistory",
  {
    repayment_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    loan_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Loan,
        key: "loan_id",
      },
      onDelete: "CASCADE",
    },

    schedule_id: {
      type: DataTypes.UUID,
      allowNull: true, // Null for foreclosure payments
      references: {
        model: EMISchedule,
        key: "schedule_id",
      },
      onDelete: "SET NULL",
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

    payment_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },

    payment_type: {
      type: DataTypes.ENUM("emi", "partial", "foreclosure"),
      allowNull: false,
    },

    paid_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "repayment_history",

    timestamps: true,

    createdAt: "created_at",
    updatedAt: false,

    indexes: [
      {
        fields: ["loan_id"],
      },
      {
        fields: ["source_account_id"],
      },
    ],
  }
);

// ─── ASSOCIATIONS ─────────────────────────────────────────────────────────────

Loan.hasMany(EMISchedule, { foreignKey: "loan_id", as: "schedules" });
EMISchedule.belongsTo(Loan, { foreignKey: "loan_id" });

Loan.hasMany(RepaymentHistory, { foreignKey: "loan_id", as: "repayments" });
RepaymentHistory.belongsTo(Loan, { foreignKey: "loan_id" });

EMISchedule.hasMany(RepaymentHistory, { foreignKey: "schedule_id" });
RepaymentHistory.belongsTo(EMISchedule, { foreignKey: "schedule_id" });

Loan.belongsTo(User, { foreignKey: "user_id", as: "user" });
Loan.belongsTo(Account, { foreignKey: "linked_account_id", as: "linked_account" });

module.exports = {
  Loan,
  EMISchedule,
  RepaymentHistory,
};
