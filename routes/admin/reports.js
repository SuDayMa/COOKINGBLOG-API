const express = require("express");
const router = express.Router();

const reportController = require("../../controllers/admin/reportController"); 
const { verifyToken } = require("../../middleware/auth");
const adminOnly = require("../../middleware/adminOnly");

router.use(verifyToken, adminOnly);

router.get("/", reportController.getAllReports);
router.patch("/:id", reportController.handleReport);

module.exports = router;