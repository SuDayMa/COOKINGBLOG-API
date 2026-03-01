const Post = require("../../models/Post");
const User = require("../../models/User");
const Category = require("../../models/Category");
const Notification = require("../../models/Notification"); // 🔥 1. Thêm Import Model Notification
const { toPublicUrl } = require("../../utils/imageHelper");

const formatMedia = (req, post) => {
  if (!post) return null;

  return {
    ...post,
    id: post._id,
    
    images: Array.isArray(post.images) && post.images.length > 0
      ? post.images.map(img => toPublicUrl(req, img)) 
      : (post.image ? [toPublicUrl(req, post.image)] : []), 
    
    video: post.video ? toPublicUrl(req, post.video) : null,

    author: post.user_id ? {
      id: post.user_id._id || post.user_id,
      name: post.user_id.name || "Người dùng ẩn danh",
      avatar: toPublicUrl(req, post.user_id.avatar)
    } : { id: null, name: "Người dùng không tồn tại", avatar: null },

    category: post.category_id ? {
      id: post.category_id._id || post.category_id,
      name: post.category_id.name || "Chưa phân loại"
    } : { id: null, name: "Chưa phân loại" }
  };
};

// 1. Lấy danh sách bài viết (Giữ nguyên)
exports.getAdminPosts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);
    const status = (req.query.status || "").trim();

    const filter = {};
    if (["pending", "approved", "hidden", "rejected"].includes(status)) {
      filter.status = status;
    }

    const [total, rows] = await Promise.all([
      Post.countDocuments(filter),
      Post.find(filter)
        .populate("user_id", "name avatar")
        .populate("category_id", "name")
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
    ]);

    const items = (rows || []).map(p => formatMedia(req, p)).filter(Boolean);

    res.status(200).json({ 
      success: true, 
      data: { page, limit, total, items, totalPages: Math.ceil(total / limit) } 
    });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống: " + e.message });
  }
};

// 2. Lấy chi tiết bài viết (Giữ nguyên)
exports.getAdminPostDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id).populate("user_id", "name avatar").populate("category_id", "name").lean();
    if (!post) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
    res.json({ success: true, data: formatMedia(req, post) });
  } catch (e) {
    res.status(500).json({ success: false, message: "ID bài viết không hợp lệ" });
  }
};

// 3. Duyệt bài / Thay đổi trạng thái bài viết 
exports.updatePostStatus = async (req, res) => {
  try {
    const { status, reason } = req.body; 
    const { id } = req.params;

    if (!["pending", "approved", "hidden", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
    }

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });

    post.status = status;
    await post.save();

    if (status === "approved" || status === "rejected") {
      const kind = status === "approved" ? "post_approved" : "post_rejected";
      const content = status === "approved" 
        ? "Bài viết của bạn đã được duyệt thành công!" 
        : `Bài viết đã bị từ chối: ${reason || "Không đạt tiêu chuẩn cộng đồng"}`;

      await Notification.create({
        id: Date.now().toString(),
        recipient_id: String(post.user_id), 
        actor_id: String(req.user.id), 
        kind: kind,
        post_id: String(post._id),
        post_title: post.title,
        post_image: Array.isArray(post.images) ? post.images[0] : post.image,
        content: content,
        read: false
      });
    }
    
    res.json({ 
      success: true, 
      message: `Đã cập nhật trạng thái sang: ${status}`, 
      data: post 
    });
  } catch (e) {
    console.error("🔥 UPDATE_STATUS_ERROR:", e.message);
    res.status(500).json({ success: false, message: "Lỗi cập nhật trạng thái" });
  }
};

// 4. Xóa bài viết vĩnh viễn 
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Post.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
    res.json({ success: true, message: "Đã xóa bài viết thành công" });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi khi xóa bài viết" });
  }
};