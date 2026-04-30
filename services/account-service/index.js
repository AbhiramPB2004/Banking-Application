const express = require("express");
const router = express.Router();

const accountRoutes = require("./routes/account.routes");

router.use("/", accountRoutes);

module.exports = router;