// /services/payment-tracking-service/controllers/paymentTracking.controller.js

const paymentTrackingService = require("../services/paymentTracking.service");

/**
 * Get all payments for the authenticated user
 */
async function getPayments(req, res) {
  try {
    const userId = req.user.user_id;
    const { status, payment_type, search, start_date, end_date, page, limit } = req.query;

    const result = await paymentTrackingService.getUserPayments(
      userId,
      { status, payment_type, search, start_date, end_date },
      { page, limit }
    );

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("Get payments error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Get payment by reference ID
 */
async function getPaymentByRef(req, res) {
  try {
    const { referenceId } = req.params;
    const payment = await paymentTrackingService.getPaymentByReference(referenceId);
    return res.json({ success: true, data: payment });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
}

/**
 * Get analytics summary
 */
async function getAnalytics(req, res) {
  try {
    const userId = req.user.user_id;
    const result = await paymentTrackingService.getAnalyticsSummary(userId);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Manually create a payment record (if needed by frontend)
 */
async function createPayment(req, res) {
  try {
    const userId = req.user.user_id;
    const paymentData = { ...req.body, user_id: userId };

    const result = await paymentTrackingService.createPaymentRecord(paymentData);
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

module.exports = {
  getPayments,
  getPaymentByRef,
  getAnalytics,
  createPayment,
};
