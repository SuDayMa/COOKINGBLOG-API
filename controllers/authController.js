const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); 
const { toPublicUrl } = require("../utils/imageHelper");
const { sendOTPEmail } = require("../utils/emailHelper"); // Import helper Sự vừa tạo

const signToken = (user) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("Server configuration error: JWT_SECRET is missing");
    }

    const payload = { 
        id: user._id, 
        email: user.email, 
        role: user.role || "user" 
    };

    return jwt.sign(payload, secret, { 
        expiresIn: process.env.JWT_EXPIRES_IN || "7d" 
    });
};

// 1. ĐĂNG KÝ: Tạo User ở trạng thái chờ và gửi OTP về Gmail
exports.register = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body || {};
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ thông tin" });
        }

        const emailClean = email.toLowerCase().trim();
        const exists = await User.findOne({ email: emailClean });
        
        // Nếu user đã tồn tại và đã xác thực xong xuôi
        if (exists && exists.isVerified) {
            return res.status(409).json({ success: false, message: "Email này đã được đăng ký" });
        }

        // Tạo mã OTP 6 số ngẫu nhiên
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 5 * 60 * 1000; // Hết hạn sau 5 phút
        const hashed = await bcrypt.hash(password, 10);

        // upsert: true giúp cập nhật lại thông tin/OTP mới nếu đăng ký lại mà chưa verify
        const user = await User.findOneAndUpdate(
            { email: emailClean },
            { 
                name: name.trim(), 
                password: hashed,
                phone: phone || null,
                role: "user",
                otp,
                otpExpires,
                isVerified: false 
            },
            { upsert: true, new: true }
        );

        // Gửi mã qua Helper trong utils
        await sendOTPEmail(emailClean, otp, name);

        res.status(200).json({
            success: true,
            message: "Mã OTP đã được gửi về Gmail của bạn"
        });
    } catch (e) {
        console.error("REGISTER ERROR:", e.message);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi đăng ký" });
    }
};

// 2. XÁC THỰC OTP: Kiểm tra mã Pin và kích hoạt tài khoản
exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ success: false, message: "Thiếu email hoặc mã OTP" });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

        if (!user) {
            return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
        }

        // Kiểm tra mã OTP khớp không và còn hạn không
        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ success: false, message: "Mã xác thực không đúng hoặc đã hết hạn" });
        }

        // Kích hoạt tài khoản và dọn dẹp OTP
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        // Đăng ký và Verify xong thì cho đăng nhập luôn (cấp Token)
        const access_token = signToken(user);

        res.status(200).json({
            success: true,
            message: "Xác thực thành công",
            data: { 
                user: { 
                    id: user._id, 
                    name: user.name, 
                    email: user.email,
                    role: user.role,
                    avatar: toPublicUrl(req, user.avatar) 
                }, 
                access_token 
            }
        });
    } catch (e) {
        console.error("VERIFY OTP ERROR:", e.message);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi xác thực" });
    }
};

// 3. ĐĂNG NHẬP: Kiểm tra thêm điều kiện isVerified
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body || {};
        
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập email và mật khẩu" });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không chính xác" });
        }

        // CHẶN: Nếu tài khoản chưa verify Gmail
        if (!user.isVerified) {
            return res.status(403).json({ 
                success: false, 
                message: "Tài khoản chưa xác thực. Vui lòng kiểm tra mã OTP trong Gmail." 
            });
        }

        if (user.is_blocked) {
            return res.status(403).json({ success: false, message: "Tài khoản của bạn đã bị khóa" });
        }

        const token = signToken(user);

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: toPublicUrl(req, user.avatar) 
                },
                access_token: token
            }
        });
    } catch (e) {
        console.error("LOGIN ERROR:", e.message);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi đăng nhập" });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).lean();
        
        if (!user) {
            return res.status(401).json({ success: false, message: "Phiên đăng nhập không hợp lệ" });
        }
        
        user.avatar = toPublicUrl(req, user.avatar);
        user.id = user._id; 
        
        res.status(200).json({ success: true, data: user });
    } catch (e) {
        console.error("GETME ERROR:", e.message);
        res.status(500).json({ success: false, message: "Lỗi lấy thông tin cá nhân" });
    }
};