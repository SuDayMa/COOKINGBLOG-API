const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { toPublicUrl } = require("../utils/imageHelper");

const signToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
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

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ success: false, message: "Email đã tồn tại" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.toLowerCase(), password: hashed });

    const access_token = signToken(user);

    res.status(201).json({
      success: true,
      data: { 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email,
          avatar: toPublicUrl(req, user.avatar) 
        }, 
        access_token 
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email: email?.toLowerCase() });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng" });
    }

    const access_token = signToken(user);

    res.status(200).json({
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
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

exports.getMe = async (req, res) => {
  const user = await User.findOne({ id: req.user.id }).select("-password").lean();
  if (!user) return res.status(401).json({ success: false, message: "Không tìm thấy người dùng" });
  
  user.avatar = toPublicUrl(req, user.avatar);
  
  res.status(200).json({ success: true, data: user });
};