// /services/credit-card-service/index.js

const express = require("express");

const router = require(
  "./routes/creditCard.routes"
);

const app = express();

/**
 * Core Middleware
 */
app.use(express.json());

/**
 * Credit Card Service Routes
 *
 * Gateway handles:
 * - JWT verification
 * - Security
 * - Rate limiting
 * - Audit
 *
 * This module focuses only on domain routes.
 */
app.use("/", router);

module.exports = app;