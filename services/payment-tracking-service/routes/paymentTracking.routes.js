// /services/payment-tracking-service/routes/paymentTracking.routes.js

const express = require("express");
const router = express.Router();
const paymentTrackingController = require("../controllers/paymentTracking.controller");

/**
 * Payment Tracking Routes
 * (Auth middleware is applied at the gateway level)
 */

router.get("/", paymentTrackingController.getPayments);
router.get("/analytics", paymentTrackingController.getAnalytics);
router.get("/:referenceId", paymentTrackingController.getPaymentByRef);
router.post("/create", paymentTrackingController.createPayment);

module.exports = router;
