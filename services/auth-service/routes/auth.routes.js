// /services/auth-service/routes/auth.routes.js

const express = require("express");
const router = express.Router();

const {
  registerUser,
} = require("../controllers/authController");

/**
 * User Registration Route
 * POST /auth/register
 */
router.post("/register", registerUser);


module.exports = router;

const { loginUser } = require("../controllers/authController");

router.post("/login", loginUser);