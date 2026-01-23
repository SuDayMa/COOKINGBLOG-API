const User = require("../models/User");

module.exports = async function adminOnly(req, res, next) {
  try {
    const userId = req.user?.id;
    const userRoleFromToken = req.user?.role;

    if (!userId || userRoleFromToken !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Truy cập bị từ chối: Yêu cầu quyền Admin" 
      });
    }

    const user = await User.findById(userId)
      .select("role is_blocked")
      .lean();

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Người dùng không tồn tại hoặc phiên đăng nhập hết hạn" 
      });
    }

    if (user.is_blocked) {
      return res.status(403).json({ 
        success: false, 
        message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ." 
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Quyền truy cập của bạn đã thay đổi. Bạn không còn quyền Admin." 
      });
    }

    next();
  } catch (error) {
    console.error("ADMIN_ONLY_MIDDLEWARE_ERROR:", error.message);
    return res.status(500).json({ 
      success: false, 
      message: "Lỗi xác thực quyền hạn hệ thống" 
    });
  }
};