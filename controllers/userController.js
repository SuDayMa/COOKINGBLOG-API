const User = require("../models/User"); 
const Post = require("../models/Post"); 
const { toPublicUrl } = require("../utils/imageHelper"); 
const bcrypt = require("bcryptjs");

// LẤY PROFILE CÔNG KHAI
exports.getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("name avatar bio postCount followerCount")
      .lean();

    if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });

    res.status(200).json({ 
      success: true, 
      data: { ...user, id: user._id, avatar: toPublicUrl(req, user.avatar) } 
    });
  } catch (e) {
    res.status(500).json({ success: false, message: "ID không hợp lệ" });
  }
};

// CẬP NHẬT ẢNH ĐẠI DIỆN (Đây là phần Su cần nè!)
exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Không tìm thấy file ảnh" });
    }

    const avatarUrl = req.file.path; // URL từ Cloudinary

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { avatar: avatarUrl } },
      { new: true }
    ).select("-password").lean();

    res.status(200).json({ 
      success: true, 
      message: "Cập nhật ảnh đại diện thành công",
      data: { ...user, id: user._id, avatar: toPublicUrl(req, user.avatar) }
    });
  } catch (e) {
    console.error("Lỗi upload avatar:", e);
    res.status(500).json({ success: false, message: "Lỗi upload ảnh lên Cloudinary" });
  }
};

// CẬP NHẬT THÔNG TIN CÁ NHÂN
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, bio } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { name, phone, bio } },
      { new: true }
    ).select("-password").lean();

    res.status(200).json({ 
      success: true, 
      data: { ...user, id: user._id, avatar: toPublicUrl(req, user.avatar) } 
    });
  } catch (e) {
    res.status(400).json({ success: false, message: "Dữ liệu không hợp lệ" });
  }
};

// LẤY DANH SÁCH TẤT CẢ NGƯỜI DÙNG 
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }) 
      .select("name avatar bio followerCount postCount")
      .lean();

    const data = users.map(user => ({
      ...user,
      id: user._id,
      avatar: toPublicUrl(req, user.avatar)
    }));

    res.status(200).json({ 
      success: true, 
      data: data 
    });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi lấy danh sách người dùng" });
  }
};

// LẤY BÀI VIẾT CỦA MỘT USER CỤ THỂ
exports.getUserPosts = async (req, res) => {
  try {
    const items = await Post.find({ user_id: req.params.id, status: "approved" })
      .sort({ created_at: -1 })
      .lean();

    const data = items.map(p => ({ 
      ...p, 
      id: p._id,
      images: p.images?.map(img => toPublicUrl(req, img)) || [],
      video: p.video || null
    }));

    res.status(200).json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi lấy danh sách bài viết" });
  }
};

exports.deleteMyAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    await Post.deleteMany({ user_id: userId });

    const Comment = require("../models/Comment"); 
    await Comment.deleteMany({ user_id: userId });
 
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: "Tài khoản và toàn bộ bài viết, bình luận đã được xóa vĩnh viễn"
    });

  } catch (error) {
    console.error("Lỗi xóa tài khoản:", error);
    res.status(500).json({
      success: false,
      message: "Không thể xóa tài khoản. Vui lòng thử lại sau!"
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    // 1. Tìm user trong DB (phải lấy cả password ra để so sánh)
    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
    }

    // 2. Kiểm tra mật khẩu cũ có đúng không
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Mật khẩu cũ không chính xác" });
    }

    // 3. Mã hóa mật khẩu mới và lưu
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật mật khẩu thành công 🎉"
    });
  } catch (e) {
    console.error("Lỗi đổi mật khẩu:", e);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi đổi mật khẩu" });
  }
};