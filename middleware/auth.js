const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: "Yêu cầu đăng nhập" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
    
    req.user = { 
      id: payload.id, 
      email: payload.email, 
      role: payload.role 
    };

    const u = await User.findOne({ id: req.user.id }).select("id is_blocked role").lean();
    
    if (!u) {
      return res.status(401).json({ success: false, message: "Người dùng không tồn tại" });
    }

    if (u.is_blocked) {
      return res.status(403).json({ success: false, message: "Tài khoản của bạn đã bị khóa" });
    }

    req.user.role = u.role;

    next();
  } catch (err) {
    const msg = err.name === "TokenExpiredError" ? "Phiên đăng nhập hết hạn" : "Token không hợp lệ";
    return res.status(401).json({ success: false, message: msg });
  }
};