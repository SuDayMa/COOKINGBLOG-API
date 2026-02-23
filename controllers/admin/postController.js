const Post = require("../../models/Post");
const User = require("../../models/User");
const Category = require("../../models/Category");
const { toPublicUrl } = require("../../utils/imageHelper");

const formatMedia = (req, post) => {
  if (!post) return null;

  return {
    ...post,
    id: post._id,
    
    // 1. XỬ LÝ ẢNH: Trả về mảng images dù data lưu kiểu gì
    images: Array.isArray(post.images) && post.images.length > 0
      ? post.images.map(img => toPublicUrl(req, img)) 
      : (post.image ? [toPublicUrl(req, post.image)] : []), 
    
    // 2. XỬ LÝ VIDEO: Chuyển path thành URL công khai hoàn chỉnh
    video: post.video ? toPublicUrl(req, post.video) : null,

    // 3. THÔNG TIN TÁC GIẢ (An toàn): Không bị crash nếu user bị xóa
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


// 1. Lấy danh sách bài viết (Có phân trang, lọc theo trạng thái)
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

    // Format lại dữ liệu và loại bỏ các phần tử lỗi
    const items = (rows || []).map(p => formatMedia(req, p)).filter(Boolean);

    res.status(200).json({ 
      success: true, 
      data: { 
        page, 
        limit, 
        total, 
        items,
        totalPages: Math.ceil(total / limit)
      } 
    });
  } catch (e) {
    console.error("🔥 ADMIN_GET_POSTS_ERROR:", e.stack);
    res.status(500).json({ success: false, message: "Lỗi hệ thống: " + e.message });
  }
};

// 2. Lấy chi tiết bài viết theo ID
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
    res.status(500).json({ success: false, message: "ID bài viết không hợp lệ" });
  }
};

// 3. Duyệt bài / Thay đổi trạng thái bài viết
exports.updatePostStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!["pending", "approved", "hidden", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
    }

    const post = await Post.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    ).lean();
    
    if (!post) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
    
    res.json({ 
      success: true, 
      message: `Đã cập nhật trạng thái sang: ${status}`, 
      data: post 
    });
  } catch (e) {
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