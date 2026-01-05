const express = require("express");
const router = express.Router();
const reportController = require("../controllers/admin/reportController");

// Lấy danh sách báo cáo
router.get("/", reportController.getAllReports);

module.exports = router;