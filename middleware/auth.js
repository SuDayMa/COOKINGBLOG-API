const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ") 
      ? authHeader.split(" ")[1] 
      : null;

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Bạn cần đăng nhập để thực hiện hành động này" 
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
 
    const user = await User.findOne({
      $or: [
        { _id: payload.id },
        { id: payload.id }
      ]
    })
    .select("_id role is_blocked email")
    .lean();
    
    if (!user) {
      console.log("❌ Không tìm thấy User với payload.id:", payload.id);
      return res.status(401).json({ 
        success: false, 
        message: "Người dùng không tồn tại hoặc phiên làm việc không hợp lệ" 
      });
    }

    if (user.is_blocked) {
      return res.status(403).json({ 
        success: false, 
        message: "Tài khoản của bạn đã bị khóa, vui lòng liên hệ Admin" 
      });
    }

    req.user = { 
      id: String(user._id), 
      email: user.email, 
      role: user.role 
    };

    next();
  } catch (err) {
    console.error("AUTH_MIDDLEWARE_ERROR:", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Phiên đăng nhập đã hết hạn" });
    }
    
    return res.status(401).json({ success: false, message: "Xác thực không thành công" });
  }
};