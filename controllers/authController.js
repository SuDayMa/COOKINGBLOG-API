const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { toPublicUrl } = require("../utils/imageHelper");

const signToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("CRITICAL: JWT_SECRET is undefined in environment variables.");
    throw new Error("Server configuration error");
  }

  const payload = { 
    id: user.id || user._id, 
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
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
    }

    const emailClean = email.toLowerCase().trim();
    const exists = await User.findOne({ email: emailClean });
    if (exists) {
      return res.status(409).json({ success: false, message: "Email đã tồn tại" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      name: name.trim(), 
      email: emailClean, 
      password: hashed,
      role: "user",      
      is_blocked: false  
    });

    const access_token = signToken(user);

    res.status(201).json({
      success: true,
      data: { 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email,
          role: user.role,
          avatar: user.avatar ? toPublicUrl(req, user.avatar) : null 
        }, 
        access_token 
      }
    });
  } catch (e) {
    console.error("REGISTER ERROR:", e);
    res.status(500).json({ success: false, message: "Lỗi Server khi đăng ký" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    
    if (!email || !password) {
       return res.status(400).json({ success: false, message: "Vui lòng nhập email và mật khẩu" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng" });
    }

    if (user.is_blocked === true) {
      return res.status(403).json({ success: false, message: "Tài khoản của bạn đã bị khóa bởi Admin" });
    }

    let token;
    try {
      token = signToken(user);
    } catch (tokenErr) {
      console.error("JWT SIGN ERROR:", tokenErr.message);
      return res.status(500).json({ success: false, message: "Lỗi cấu hình bảo mật trên server" });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || "user",        
          avatar: user.avatar ? toPublicUrl(req, user.avatar) : null 
        },
        access_token: token
      }
    });
  } catch (e) {
    console.error("LOGIN ERROR:", e);
    res.status(500).json({ success: false, message: "Lỗi Server khi đăng nhập" });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id }).select("-password").lean();
    if (!user) return res.status(401).json({ success: false, message: "Không tìm thấy người dùng" });
    
    if (user.avatar) {
      user.avatar = toPublicUrl(req, user.avatar);
    }
    
    res.status(200).json({ success: true, data: user });
  } catch (e) {
    console.error("GETME ERROR:", e);
    res.status(500).json({ success: false, message: "Lỗi lấy thông tin cá nhân" });
  }
};