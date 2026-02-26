const User = require("../models/User");
const mongoose = require("mongoose"); 

module.exports = async function adminOnly(req, res, next) {
  try {
    // 1. Lấy thông tin từ req.user 
    const userId = req.user?.id;
    const userRoleFromToken = req.user?.role;

    if (!userId || userRoleFromToken !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Truy cập bị từ chối: Yêu cầu quyền Admin" 
      });
    }

    // 2. Chuẩn bị truy vấn thông minh
    
    let query = { id: userId };
    if (mongoose.Types.ObjectId.isValid(userId)) {
      query = {
        $or: [
          { _id: userId },
          { id: userId }
        ]
      };
    }

    // 3. Kiểm tra thực tế trong Database
    const user = await User.findOne(query)
      .select("role is_blocked")
      .lean();

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Người dùng không tồn tại hoặc phiên đăng nhập hết hạn" 
      });
    }

    // 4. Kiểm tra trạng thái tài khoản (Dựa trên field is_blocked trong DB)
    if (user.is_blocked) {
      return res.status(403).json({ 
        success: false, 
        message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ." 
      });
    }

    // 5. Kiểm tra lại Role thực tế (Dựa trên field role trong DB)
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