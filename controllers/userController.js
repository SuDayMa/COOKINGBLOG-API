const User = require("../../models/User");
const Post = require("../../models/Post");
const { toPublicUrl } = require("../../utils/imageHelper"); 

exports.getPublicProfile = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id })
      .select("id name avatar bio postCount followerCount likeCount")
      .lean();

    if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });

    user.avatar = toPublicUrl(req, user.avatar); 
    res.status(200).json({ success: true, data: user });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    const items = await Post.find({ user_id: req.params.id, status: "approved" })
      .sort({ created_at: -1 })
      .select("id title image video post_type created_at") 
      .lean();

    const data = items.map(p => ({ 
      ...p, 
      image: toPublicUrl(req, p.image),
      video: p.video || null
    }));

    res.status(200).json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi lấy danh sách bài viết" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, bio } = req.body || {};
    
    const user = await User.findOneAndUpdate(
      { id: req.user.id },
      { $set: { name, phone, bio } },
      { new: true }
    ).select("-password").lean();

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.avatar = toPublicUrl(req, user.avatar);
    res.status(200).json({ success: true, data: user });
  } catch (e) {
    res.status(400).json({ success: false, message: "Dữ liệu không hợp lệ" });
  }
};

exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Không tìm thấy file ảnh" });
    }

    const avatarUrl = req.file.path; 

    const user = await User.findOneAndUpdate(
      { id: req.user.id },
      { $set: { avatar: avatarUrl } },
      { new: true }
    ).select("-password").lean();

    res.status(200).json({ 
      success: true, 
      message: "Cập nhật ảnh đại diện thành công",
      data: {
        ...user,
        avatar: toPublicUrl(req, user.avatar)
      }
    });
  } catch (e) {
    console.error("Lỗi upload avatar:", e);
    res.status(500).json({ success: false, message: "Lỗi upload ảnh lên Cloudinary" });
  }
};