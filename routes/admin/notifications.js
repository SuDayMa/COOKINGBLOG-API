const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const adminAuth = require("../../middleware/adminAuth"); // Middleware kiểm tra quyền Admin
const adminNotificationController = require("../../controllers/admin/notificationController");

router.use(auth, adminAuth);

router.post("/send-private", adminNotificationController.sendPrivateNotification);

module.exports = router;