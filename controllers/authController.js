const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { toPublicUrl } = require("../utils/imageHelper");

const signToken = (user) => {
 
  if (!process.env.JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined.");
    throw new Error("Cấu hình Server thiếu JWT_SECRET");
  }

  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role || "user" 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({ success: false, message: "Email đã tồn tại" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      name: name.trim(), 
      email: email.toLowerCase().trim(), 
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
          avatar: toPublicUrl(req, user.avatar) 
        }, 
        access_token 
      }
    });
  } catch (e) {
    console.error("REGISTER ERROR:", e.message);
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
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng" });
    }

    if (user.is_blocked) {
      return res.status(403).json({ success: false, message: "Tài khoản của bạn đã bị khóa bởi Admin" });
    }

    const access_token = signToken(user);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || "user",
          avatar: toPublicUrl(req, user.avatar) 
        },
        access_token
      }
    });
  } catch (e) {
    console.error("LOGIN ERROR:", e.message);
    res.status(500).json({ success: false, message: "Lỗi Server khi đăng nhập" });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id }).select("-password").lean();
    if (!user) return res.status(401).json({ success: false, message: "Không tìm thấy người dùng" });
    
    user.avatar = toPublicUrl(req, user.avatar);
    res.status(200).json({ success: true, data: user });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi lấy thông tin cá nhân" });
  }
};