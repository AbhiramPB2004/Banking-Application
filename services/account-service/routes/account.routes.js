const express = require("express");
const router = express.Router();

const accountController = require("../controllers/accountController");

// 🔥 TEMP USER INJECTION (only for dev phase)
// router.use((req, res, next) => {
//   req.user = {
//     user_id: "11111111-1111-1111-1111-111111111111",
//     role: "customer",
//   };
//   next();
// });

//when middleware is ready
//app.use("/accounts", authMiddleware, accountRoutes);

// Routes (correct order)
// router.post("/", accountController.createAccount);

// IMPORTANT ORDER
router.get("/user/me", accountController.getUserAccounts);
router.get("/:id", accountController.getAccountById);

router.put("/:id", accountController.updateAccount);
router.delete("/:id", accountController.closeAccount);

module.exports = router;