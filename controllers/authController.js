const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); 
const { toPublicUrl } = require("../utils/imageHelper");

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

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body || {};
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ thông tin" });
        }

        const emailClean = email.toLowerCase().trim();
        const exists = await User.findOne({ email: emailClean });
        if (exists) {
            return res.status(409).json({ success: false, message: "Email này đã được đăng ký" });
        }

        const hashed = await bcrypt.hash(password, 10);
        
        const user = await User.create({ 
            name: name.trim(), 
            email: emailClean, 
            password: hashed,
            role: "user"
        });

        const access_token = signToken(user);

        res.status(201).json({
            success: true,
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
        console.error("REGISTER ERROR:", e.message);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi đăng ký" });
    }
};

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