// services/payment-tracking-service/services/paymentTracking.service.js

const PaymentTracking = require("../models/paymentTracking.model");
const { sequelize } = require("../../../shared/config/db");
const { Op } = require("sequelize");

const Account = require("../../account-service/models/account.model");
const Transaction = require("../../transaction-service/models/transaction.model");

/**
 * SAFE ROUNDING
 */
function roundAmount(value) {
  return parseFloat(Number(value).toFixed(2));
}

/**
 * CREATE PAYMENT RECORD
 * Used manually or internally from transaction service.
 */
async function createPaymentRecord(data) {
  try {
    return await PaymentTracking.create({
      user_id: data.user_id,
      payment_type: data.payment_type || "TRANSFER",
      transaction_type: data.transaction_type || "PAYMENT",
      merchant_name: data.merchant_name || null,
      category: data.category || "General",
      amount: roundAmount(data.amount),
      currency: data.currency || "INR",
      status: (data.status || "SUCCESS").toUpperCase(),
      payment_method: data.payment_method || "BANK_TRANSFER",
      reference_id: data.reference_id,
      related_entity_id: data.related_entity_id || null,
      description: data.description || null,
    });
  } catch (error) {
    console.error(
      "Error creating payment tracking record:",
      error.message
    );
    throw new Error(
      "Failed to create payment tracking record."
    );
  }
}

/**
 * CREATE PAYMENT RECORD FROM TRANSACTION
 * Automatically maps transaction table data to payment_tracking.
 */
async function createPaymentFromTransaction(
  transactionId
) {
  const txn = await Transaction.findByPk(
    transactionId
  );

  if (!txn) {
    throw new Error("Transaction not found.");
  }

  // Determine source account
  const accountId =
    txn.from_account_id || txn.to_account_id;

  const account = await Account.findByPk(accountId);

  if (!account) {
    throw new Error("Account not found.");
  }

  // Determine payment type
  let paymentType = "TRANSFER";

  if (txn.transaction_type === "deposit") {
    paymentType = "TRANSFER";
  } else if (
    txn.transaction_type === "withdraw"
  ) {
    paymentType = "TRANSFER";
  } else if (
    ["internal", "imps", "neft", "rtgs"].includes(
      txn.transaction_type
    )
  ) {
    paymentType = "TRANSFER";
  }

  // Determine transaction type
  let trackingTxnType = "PAYMENT";

  if (txn.transaction_type === "deposit") {
    trackingTxnType = "PAYMENT";
  } else if (
    txn.transaction_type === "withdraw"
  ) {
    trackingTxnType = "PAYMENT";
  }

  // Determine status
  let status = "SUCCESS";

  if (txn.status === "failed") {
    status = "FAILED";
  } else if (txn.status === "pending") {
    status = "PENDING";
  }

  // Prevent duplicate entry
  const existing =
    await PaymentTracking.findOne({
      where: {
        reference_id: txn.reference_id,
      },
    });

  if (existing) {
    return existing;
  }

  // Create tracking entry
  return await PaymentTracking.create({
    user_id: account.user_id,
    payment_type: paymentType,
    transaction_type: trackingTxnType,
    merchant_name: txn.recipient_name || null,
    category: "Banking",
    amount: roundAmount(txn.amount),
    currency: "INR",
    status,
    payment_method: "BANK_TRANSFER",
    reference_id: txn.reference_id,
    related_entity_id:
      txn.transaction_id,
    description: `${txn.transaction_type.toUpperCase()} transaction`,
    created_at: txn.created_at,
    updated_at: txn.created_at,
  });
}

/**
 * SYNC ALL TRANSACTIONS TO PAYMENT TRACKING
 * Run once to backfill existing transactions.
 */
async function syncTransactionsToPaymentTracking() {
  const transactions =
    await Transaction.findAll({
      order: [["created_at", "ASC"]],
    });

  const results = [];

  for (const txn of transactions) {
    try {
      const record =
        await createPaymentFromTransaction(
          txn.transaction_id
        );
      results.push(record);
    } catch (error) {
      console.error(
        `Failed to sync transaction ${txn.transaction_id}:`,
        error.message
      );
    }
  }

  return {
    totalTransactions: transactions.length,
    synced: results.length,
  };
}

/**
 * GET USER PAYMENTS
 */
async function getUserPayments(
  userId,
  filters = {},
  pagination = {}
) {
  const {
    status,
    payment_type,
    search,
    start_date,
    end_date,
    related_entity_id,
  } = filters;

  const {
    page = 1,
    limit = 100,
  } = pagination;

  const where = {
    user_id: userId,
  };

  if (status) {
    where.status = status.toUpperCase();
  }

  if (payment_type) {
    where.payment_type = payment_type;
  }

  if (related_entity_id) {
    where.related_entity_id =
      related_entity_id;
  }

  if (search) {
    where[Op.or] = [
      {
        reference_id: {
          [Op.iLike]: `%${search}%`,
        },
      },
      {
        merchant_name: {
          [Op.iLike]: `%${search}%`,
        },
      },
      {
        description: {
          [Op.iLike]: `%${search}%`,
        },
      },
    ];
  }

  if (start_date || end_date) {
    where.created_at = {};

    if (start_date) {
      where.created_at[Op.gte] =
        new Date(start_date);
    }

    if (end_date) {
      where.created_at[Op.lte] =
        new Date(end_date);
    }
  }

  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);

  const { count, rows } =
    await PaymentTracking.findAndCountAll({
      where,
      order: [["created_at", "DESC"]],
      limit: parsedLimit,
      offset:
        (parsedPage - 1) * parsedLimit,
    });

  return {
    totalItems: count,
    totalPages: Math.ceil(
      count / parsedLimit
    ),
    currentPage: parsedPage,
    payments: rows,
  };
}

/**
 * GET PAYMENT BY REFERENCE ID
 */
async function getPaymentByReference(
  referenceId
) {
  const payment =
    await PaymentTracking.findOne({
      where: {
        reference_id: referenceId,
      },
    });

  if (!payment) {
    throw new Error(
      "Payment record not found."
    );
  }

  return payment;
}

/**
 * GET ANALYTICS SUMMARY
 */
async function getAnalyticsSummary(
  userId
) {
  const stats =
    await PaymentTracking.findAll({
      where: {
        user_id: userId,
      },
      attributes: [
        "status",
        [
          sequelize.fn(
            "COUNT",
            sequelize.col(
              "payment_tracking_id"
            )
          ),
          "count",
        ],
        [
          sequelize.fn(
            "SUM",
            sequelize.col("amount")
          ),
          "total_amount",
        ],
      ],
      group: ["status"],
      raw: true,
    });

  const monthlyStats =
    await PaymentTracking.findAll({
      where: {
        user_id: userId,
        status: "SUCCESS",
      },
      attributes: [
        [
          sequelize.fn(
            "DATE_TRUNC",
            "month",
            sequelize.col("created_at")
          ),
          "month",
        ],
        [
          sequelize.fn(
            "SUM",
            sequelize.col("amount")
          ),
          "total_amount",
        ],
      ],
      group: [
        sequelize.fn(
          "DATE_TRUNC",
          "month",
          sequelize.col("created_at")
        ),
      ],
      order: [
        [
          sequelize.fn(
            "DATE_TRUNC",
            "month",
            sequelize.col("created_at")
          ),
          "ASC",
        ],
      ],
      raw: true,
    });

  let totalPayments = 0;
  let successfulPayments = 0;
  let failedPayments = 0;
  let pendingPayments = 0;
  let totalAmountPaid = 0;

  stats.forEach((s) => {
    const count = parseInt(s.count);
    totalPayments += count;

    if (s.status === "SUCCESS") {
      successfulPayments = count;
      totalAmountPaid = parseFloat(
        s.total_amount || 0
      );
    } else if (s.status === "FAILED") {
      failedPayments = count;
    } else if (s.status === "PENDING") {
      pendingPayments = count;
    }
  });

  return {
    totalPayments,
    successfulPayments,
    failedPayments,
    pendingPayments,
    totalAmountPaid,
    monthlyStats,
  };
}

module.exports = {
  createPaymentRecord,
  createPaymentFromTransaction,
  syncTransactionsToPaymentTracking,
  getUserPayments,
  getPaymentByReference,
  getAnalyticsSummary,
};