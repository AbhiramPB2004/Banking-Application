const express = require("express");
const router = express.Router();

const fdController = require("../controller/fd.controller");

 // ✅ correct

router.post("/create",  fdController.createFD);
router.get("/", fdController.getFDs);
router.get("/:id", fdController.getFDById);
router.patch("/close/:id", fdController.closeFD);

module.exports = router;