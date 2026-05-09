// /services/payment-tracking-service/services/paymentTracking.service.js

const PaymentTracking = require("../models/paymentTracking.model");
const { sequelize } = require("../../../shared/config/db");
const { Op } = require("sequelize");

/**
 * createPaymentRecord
 * Adds a new entry to the payment tracking system.
 */
async function createPaymentRecord(data) {
  try {
    return await PaymentTracking.create(data);
  } catch (error) {
    console.error("Error creating payment record:", error.message);
    throw new Error("Failed to create payment tracking record.");
  }
}

/**
 * getUserPayments
 * Fetches payments for a user with filtering and pagination.
 */
async function getUserPayments(userId, filters = {}, pagination = {}) {
  const { status, payment_type, search, start_date, end_date, related_entity_id } = filters;
  const { page = 1, limit = 100 } = pagination; // Increased default limit for statements

  const where = { user_id: userId };

  if (status) where.status = status;
  if (payment_type) where.payment_type = payment_type;
  if (related_entity_id) where.related_entity_id = related_entity_id;
  
  if (search) {
    where[Op.or] = [
      { reference_id: { [Op.iLike]: `%${search}%` } },
      { merchant_name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } }
    ];
  }
  
  if (start_date || end_date) {
    where.created_at = {};
    if (start_date) where.created_at[Op.gte] = new Date(start_date);
    if (end_date) where.created_at[Op.lte] = new Date(end_date);
  }

  const { count, rows } = await PaymentTracking.findAndCountAll({
    where,
    order: [["created_at", "DESC"]],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
  });

  return {
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page),
    payments: rows,
  };
}

/**
 * getPaymentByReference
 */
async function getPaymentByReference(referenceId) {
  const payment = await PaymentTracking.findOne({ where: { reference_id: referenceId } });
  if (!payment) throw new Error("Payment record not found.");
  return payment;
}

/**
 * getAnalyticsSummary
 */
async function getAnalyticsSummary(userId) {
  const stats = await PaymentTracking.findAll({
    where: { user_id: userId },
    attributes: [
      "status",
      [sequelize.fn("COUNT", sequelize.col("payment_tracking_id")), "count"],
      [sequelize.fn("SUM", sequelize.col("amount")), "total_amount"],
    ],
    group: ["status"],
    raw: true,
  });

  // Group by month for analytics
  const monthlyStats = await PaymentTracking.findAll({
    where: {
      user_id: userId,
      status: "SUCCESS",
    },
    attributes: [
      [sequelize.fn("DATE_TRUNC", "month", sequelize.col("created_at")), "month"],
      [sequelize.fn("SUM", sequelize.col("amount")), "total_amount"],
    ],
    group: [sequelize.fn("DATE_TRUNC", "month", sequelize.col("created_at"))],
    order: [[sequelize.fn("DATE_TRUNC", "month", sequelize.col("created_at")), "ASC"]],
    raw: true,
  });

  let totalPayments = 0;
  let successfulPayments = 0;
  let failedPayments = 0;
  let totalAmountPaid = 0;

  stats.forEach((s) => {
    const count = parseInt(s.count);
    totalPayments += count;
    if (s.status === "SUCCESS") {
      successfulPayments = count;
      totalAmountPaid = parseFloat(s.total_amount || 0);
    } else if (s.status === "FAILED") {
      failedPayments = count;
    }
  });

  return {
    totalPayments,
    successfulPayments,
    failedPayments,
    totalAmountPaid,
    monthlyStats,
  };
}

module.exports = {
  createPaymentRecord,
  getUserPayments,
  getPaymentByReference,
  getAnalyticsSummary,
};
