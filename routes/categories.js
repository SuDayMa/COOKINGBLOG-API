const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController"); // Import controller

// App Mobile gọi đường dẫn này để hiện danh sách nút bấm
router.get("/", categoryController.getAllCategories); 

module.exports = router;