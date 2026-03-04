const express = require("express");
const router = express.Router();

const authController = require("../../controllers/authController"); 
const auth = require("../../middleware/auth"); 

// Đăng ký & Xác thực tài khoản mới
router.post("/register", authController.register);
router.post("/verify-otp", authController.verifyOtp); 

// Đăng nhập
router.post("/login", authController.login);

// THÊM VÀO ĐÂY: Quên mật khẩu
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-reset-otp", authController.verifyResetOtp); 
router.post("/reset-password", authController.resetPassword);

// Lấy thông tin cá nhân
router.get("/me", auth, authController.getMe);

module.exports = router;