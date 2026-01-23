const Post = require("../../models/Post");
const User = require("../../models/User");
const Category = require("../../models/Category");
const { toPublicUrl } = require("../../utils/imageHelper");

// Helper an toàn để xử lý URL 
const formatMedia = (req, post) => {
  return {
    ...post,
    id: post._id,
    images: Array.isArray(post.images) 
      ? post.images.map(img => toPublicUrl(req, img)) 
      : [toPublicUrl(req, post.image)], 
    video: post.video || null,
    author: post.user_id ? {
      id: post.user_id._id,
      name: post.user_id.name,
      avatar: toPublicUrl(req, post.user_id.avatar)
    } : { name: "Người dùng không tồn tại", avatar: null },
    category: post.category_id ? {
      id: post.category_id._id,
      name: post.category_id.name
    } : { name: "Chưa phân loại" }
  };
};

// 1. Lấy danh sách bài viết cho Admin 
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

    const items = rows.map(p => formatMedia(req, p));

    res.status(200).json({ 
      success: true, 
      data: { page, limit, total, items } 
    });
  } catch (e) {
    console.error("ADMIN_GET_POSTS_ERROR:", e.message);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi lấy danh sách" });
  }
};

// 2. Chi tiết bài viết
exports.getAdminPostDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await Post.findById(id)
      .populate("user_id", "name avatar")
      .populate("category_id", "name")
      .lean();

    if (!post) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
    }

    res.json({ 
      success: true, 
      data: formatMedia(req, post)
    });
  } catch (e) {
    res.status(500).json({ success: false, message: "ID bài viết không hợp lệ hoặc lỗi hệ thống" });
  }
};

// 3. Cập nhật trạng thái (Duyệt/Ẩn/Từ chối)
exports.updatePostStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!["pending", "approved", "hidden", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
    }

    const post = await Post.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    
    if (!post) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
    
    res.json({ success: true, message: `Đã chuyển trạng thái sang: ${status}`, data: post });
  } catch (e) {
    res.status(500).json({ success: false, message: "Không thể cập nhật trạng thái" });
  }
};

// 4. Xóa bài viết
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await Post.findByIdAndDelete(id);

    if (!result) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
    res.json({ success: true, message: "Đã xóa bài viết vĩnh viễn" });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi khi xóa bài viết" });
  }
};