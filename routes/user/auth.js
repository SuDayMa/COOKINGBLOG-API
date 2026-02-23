const express = require("express");
const router = express.Router();

const authController = require("../../controllers/authController"); 
const auth = require("../../middleware/auth"); 

router.post("/register", authController.register);

router.post("/verify-otp", authController.verifyOtp); 

// Đăng nhập
router.post("/login", authController.login);

// Lấy thông tin cá nhân
router.get("/me", auth, authController.getMe);

module.exports = router;