const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const { toPublicUrl } = require("../../utils/imageHelper");

// Helper tạo Token
const signToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập email và mật khẩu" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Kiểm tra sự tồn tại và quyền Admin
    if (!user || user.role !== "admin") {
      return res.status(401).json({ success: false, message: "Tài khoản không có quyền truy cập Admin" });
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Mật khẩu không chính xác" });
    }

    const access_token = signToken(user);

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          // Sử dụng helper để hiện avatar admin chuẩn xác
          avatar: toPublicUrl(req, user.avatar),
        },
        access_token,
      },
    });
  } catch (e) {
    console.error("ADMIN LOGIN ERROR:", e);
    return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};