const accountService = require("../services/accountService");
const { validateAccountInput } = require("../validators/accountValidator");

/**
 * Create Account
 */
async function createAccount(req, res) {
  try {
    console.log("BODY:", req.body);
    const user_id = req.user.user_id; // ALWAYS from JWT
    const data = req.body;

    const validation = validateAccountInput(data);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors,
      });
    }

    const account = await accountService.createAccount(user_id, data);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: account,
    });
  } catch (error) {
  console.error("ERROR STACK:", error.stack); // IMPORTANT
  return res.status(500).json({
    success: false,
    message: error.message,
  });
}
}

/**
 * Get Single Account
 */
async function getAccountById(req, res) {
  try {
    const user_id = req.user.user_id;
    const { id } = req.params;

    const account = await accountService.getAccountById(id, user_id);

    return res.json({
      success: true,
      data: account,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Get All Accounts of User
 */
async function getUserAccounts(req, res) {
  try {
    
    const user_id = req.user.user_id;

    const accounts = await accountService.getAccountsByUserId(user_id);

    return res.json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Update Account
 */
async function updateAccount(req, res) {
  try {
    const user_id = req.user.user_id;
    const { id } = req.params;

    const updated = await accountService.updateAccount(id, user_id, req.body);

    return res.json({
      success: true,
      message: "Account updated",
      data: updated,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Close Account
 */
async function closeAccount(req, res) {
  try {
    const user_id = req.user.user_id;
    const { id } = req.params;

    const closed = await accountService.closeAccount(id, user_id);

    return res.json({
      success: true,
      message: "Account closed successfully",
      data: closed,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}


module.exports = {
  createAccount,
  getAccountById,
  getUserAccounts,
  updateAccount,
  closeAccount,
};