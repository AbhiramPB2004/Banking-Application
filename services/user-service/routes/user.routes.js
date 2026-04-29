const express = require("express");
const router = express.Router();

const userController = require("../controller/UserController");

/**
 * SELF ROUTES
 * JWT required
 * req.user.user_id from gateway
 */

/* Get logged-in user profile */
router.get("/me", userController.getUserProfile);

/* Update own profile */
router.put("/me", userController.updateUserProfile);

/* Submit / update own KYC */
router.patch("/kyc", userController.updateKYC);


/**
 * ADMIN ROUTES
 * req.user.role = admin
 */

/* Update user lifecycle status */
router.patch("/status", userController.updateUserStatus);

/* Get all users */
router.get("/all", userController.getAllUsers);

module.exports = router;