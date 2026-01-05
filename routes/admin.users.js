const express = require("express");
const router = express.Router();
const userController = require("../controllers/admin/userController");

// Lấy danh sách (Hỗ trợ: /api/admin/users?page=1&q=tu_khoa)
router.get("/", userController.getAllUsers);

// Xóa người dùng theo ID
router.delete("/:id", userController.deleteUser);

module.exports = router;