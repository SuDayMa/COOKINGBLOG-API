const User = require("../models/User");

module.exports = async function adminOnly(req, res, next) {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role; 

    if (!userId || userRole !== "admin") {
      return res.status(403).json({ success: false, message: "Truy cập bị từ chối: Yêu cầu quyền Admin" });
    }

    const user = await User.findOne({ id: userId })
      .select("id role is_blocked")
      .lean();

    if (!user) {
      return res.status(401).json({ success: false, message: "Người dùng không tồn tại" });
    }

    if (user.is_blocked) {
      return res.status(403).json({ success: false, message: "Tài khoản của bạn đã bị khóa" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Bạn không còn quyền Admin" });
    }

  
    return next();
  } catch (e) {
    console.error("ADMIN ONLY MIDDLEWARE ERROR:", e);
    return res.status(500).json({ success: false, message: "Lỗi hệ thống (Middleware)" });
  }
};