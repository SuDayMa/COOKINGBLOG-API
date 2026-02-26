const jwt = require("jsonwebtoken");
const User = require("../models/User");
const mongoose = require("mongoose"); // Thêm mongoose để kiểm tra ObjectId

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

    // 1. Giải mã Token
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
    // 2. Chuẩn bị query thông minh
    let query = { id: payload.id };
    if (mongoose.Types.ObjectId.isValid(payload.id)) {
      query = { $or: [{ _id: payload.id }, { id: payload.id }] };
    }

    // 3. Truy vấn User
    const user = await User.findOne(query)
      .select("_id role is_blocked email")
      .lean();
    
    if (!user) {
      console.log("❌ AUTH_ERROR: Không tìm thấy User với ID:", payload.id);
      return res.status(401).json({ 
        success: false, 
        message: "Phiên làm việc hết hạn hoặc không có quyền." 
      });
    }

    // 4. Kiểm tra trạng thái khóa
    if (user.is_blocked) {
      return res.status(403).json({ 
        success: false, 
        message: "Tài khoản của bạn đã bị khóa, vui lòng liên hệ Admin" 
      });
    }

    // 5. Gán dữ liệu sạch cho request sau
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