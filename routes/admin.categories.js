const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");

// Admin cũng có thể xem danh sách tại đây
router.get("/", categoryController.getAllCategories);

// Admin tạo danh mục mới (Món Kho, Món Chay...)
router.post("/", categoryController.createCategory);

// Admin xóa danh mục lỗi hoặc không dùng
router.delete("/:id", categoryController.deleteCategory);

module.exports = router;