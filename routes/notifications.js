const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const notificationController = require("../controllers/notificationController");

// Tất cả API thông báo đều cần đăng nhập
router.use(auth);

// Lấy danh sách thông báo
router.get("/", notificationController.getMyNotifications);

// Đánh dấu đã đọc (Ví dụ: /api/notifications/mark/all hoặc /api/notifications/mark/id-thong-bao)
router.patch("/mark/:id", notificationController.markAsRead);

module.exports = router;