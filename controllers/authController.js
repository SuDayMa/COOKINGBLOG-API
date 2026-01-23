const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User"); // Lùi 2 cấp thư mục
const { toPublicUrl } = require("../../utils/imageHelper");

const signToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("CRITICAL: JWT_SECRET is undefined in environment variables.");
    throw new Error("Server configuration error");
  }

  const payload = { 
    id: String(user.id), 
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
      id: `user-${Date.now()}`, 
      name: name.trim(), 
      email: emailClean, 
      password: hashed,
      role: "user",      
      is_blocked: false,
      followerCount: 0,
      followingCount: 0,
      postCount: 0
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
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi đăng ký" });
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
      return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không chính xác" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không chính xác" });
    }

    if (user.is_blocked === true) {
      return res.status(403).json({ success: false, message: "Tài khoản của bạn đã bị khóa" });
    }

    const token = signToken(user);

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
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi đăng nhập" });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id }).select("-password").lean();
    
    if (!user) {
      return res.status(401).json({ success: false, message: "Phiên đăng nhập không hợp lệ" });
    }
    
    if (user.avatar) {
      user.avatar = toPublicUrl(req, user.avatar);
    }
    
    res.status(200).json({ success: true, data: user });
  } catch (e) {
    console.error("GETME ERROR:", e);
    res.status(500).json({ success: false, message: "Lỗi lấy thông tin cá nhân" });
  }
};