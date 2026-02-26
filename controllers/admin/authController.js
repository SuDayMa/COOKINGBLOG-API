const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const { toPublicUrl } = require("../../utils/imageHelper");

// Tạo Token truy cập
const signToken = (user) => {
    return jwt.sign(
        { id: String(user._id), role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
};

exports.login = async (req, res) => {
    try {
        const email = req.body?.email?.trim().toLowerCase();
        const password = req.body?.password;

        // 1. Kiểm tra đầu vào
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: "Vui lòng nhập đầy đủ email và mật khẩu" 
            });
        }

        // 2. Tìm User và kiểm tra quyền Admin
        const user = await User.findOne({ email }).select("+password");
        
        if (!user || user.role !== "admin") {
            return res.status(401).json({ 
                success: false, 
                message: "Email hoặc mật khẩu không chính xác hoặc bạn không có quyền truy cập" 
            });
        }

        // 3. So sánh mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: "Email hoặc mật khẩu không chính xác" 
            });
        }

        // 4. Kiểm tra tài khoản có bị khóa không (An toàn thêm một bước)
        if (user.is_blocked) {
            return res.status(403).json({
                success: false,
                message: "Tài khoản Admin này hiện đang bị khóa."
            });
        }

        // 5. Tạo Token và trả về dữ liệu
        const access_token = signToken(user);

        const userData = {
            id: String(user._id), 
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: toPublicUrl(req, user.avatar),
        };

        return res.status(200).json({
            success: true,
            message: "Đăng nhập Admin thành công",
            data: {
                user: userData,
                access_token,
            },
        });

    } catch (error) {
        console.error("ADMIN_LOGIN_ERROR:", error.message);
        return res.status(500).json({ 
            success: false, 
            message: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." 
        });
    }
};