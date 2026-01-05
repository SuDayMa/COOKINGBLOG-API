const express = require("express");
const router = express.Router();
const userController = require("../controllers/admin/userController");

router.get("/", userController.getAllUsers);

// Xóa người dùng theo ID
router.delete("/:id", userController.deleteUser);

module.exports = router;