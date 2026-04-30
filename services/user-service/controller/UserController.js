

const userService = require("../services/userService");

/**
 * Every identity comes from Gateway verified JWT payload:
 * req.user = {
 *   user_id,
 *   role
 * }
 */

/**
 * GET /user/me
 * Self profile
 */
async function getUserProfile(req, res) {
  try {
    const user_id = req.user.user_id;

    const user = await userService.getUserById(user_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * PUT /user/me
 * Self update only
 */
async function updateUserProfile(req, res) {
  try {
    const user_id = req.user.user_id;

    const updatedUser = await userService.updateUserProfile(
      user_id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * PATCH /user/kyc
 * Self KYC submission
 * Admin can also verify if sent separately
 */
async function updateKYC(req, res) {
  try {
    const user_id = req.user.user_id;

    const updatedUser = await userService.updateKYCStatus(
      user_id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "KYC updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * PATCH /user/status
 * Admin only
 * JWT = admin
 * body = { target_user_id, status }
 */
async function updateUserStatus(req, res) {
  try {
    const role = req.user.role;

    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only.",
      });
    }

    const { target_user_id, status } = req.body;

    if (!target_user_id || !status) {
      return res.status(400).json({
        success: false,
        message: "target_user_id and status required.",
      });
    }

    let user;

    if (status === "active") {
      user = await userService.activateUser(target_user_id);
    } else if (status === "suspended") {
      user = await userService.suspendUser(target_user_id);
    } else if (status === "closed") {
      user = await userService.closeUser(target_user_id);
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid status.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User status updated successfully.",
      data: user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * GET /user/all
 * Admin only
 */
async function getAllUsers(req, res) {
  try {
    const role = req.user.role;

    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only.",
      });
    }

    const users = await userService.getAllUsers();

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  getUserProfile,
  updateUserProfile,
  updateKYC,
  updateUserStatus,
  getAllUsers,
};

