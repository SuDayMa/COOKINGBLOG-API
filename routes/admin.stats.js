const express = require("express");
const router = express.Router();
const statsController = require("../controllers/admin/statsController");

// Lấy toàn bộ số liệu tổng hợp
router.get("/", statsController.getDashboardStats);

module.exports = router;