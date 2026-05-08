const express = require("express");
const router = express.Router();

const fdController = require("../controller/fd.controller");

 // ✅ correct

const {
  validateCreateFD,
} = require("../validations/fd.validation");

// ✅ Create FD with validation
router.post(
  "/create",
  validateCreateFD,
  fdController.createFD
);
router.get("/", fdController.getFDs);
router.get("/:id", fdController.getFDById);
router.patch("/close/:id", fdController.closeFD);

module.exports = router;