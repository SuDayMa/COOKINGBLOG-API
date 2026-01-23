const Post = require("../../models/Post");
const User = require("../../models/User");
const Category = require("../../models/Category");
const { toPublicUrl } = require("../../utils/imageHelper");

const safePublicUrl = (req, path) => {
  try {
    if (!path || typeof path !== 'string') return null;
    return toPublicUrl(req, path);
  } catch (err) {
    return null;
  }
};

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
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
    ]);

    const userIds = [...new Set(rows.map(r => r.user_id).filter(Boolean))];
    const categoryIds = [...new Set(rows.map(r => r.category_id).filter(Boolean))];

    const [users, categories] = await Promise.all([
      User.find({ id: { $in: userIds } }).select("id name avatar").lean(),
      Category.find({ id: { $in: categoryIds } }).select("id name").lean()
    ]);

    const userMap = new Map(users.map(u => [u.id, u]));
    const categoryMap = new Map(categories.map(c => [c.id, c]));

    const items = rows.map(p => {
      const u = userMap.get(p.user_id);
      const c = categoryMap.get(p.category_id); 
      
      return {
        ...p,
        image: safePublicUrl(req, p.image),
        video: p.video || null, 
        author: u ? { 
          id: u.id,
          name: u.name, 
          avatar: safePublicUrl(req, u.avatar) 
        } : { name: "Người dùng không tồn tại", avatar: null },
        category_name: c ? c.name : "Chưa phân loại",
        category: c ? { id: c.id, name: c.name } : { name: "Chưa phân loại" }
      };
    });

    res.status(200).json({ success: true, data: { page, limit, total, items } });
  } catch (e) {
    console.error("ADMIN GET POSTS ERROR:", e);
    res.status(500).json({ success: false, message: "Lỗi hệ thống: " + e.message });
  }
};

exports.getAdminPostDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await Post.findOne({ id }).lean();

    if (!post) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
    }

    const [author, category] = await Promise.all([
      User.findOne({ id: post.user_id }).select("id name avatar").lean(),
      Category.findOne({ id: post.category_id }).select("id name").lean()
    ]);

    res.json({ 
      success: true, 
      data: { 
        ...post, 
        image: safePublicUrl(req, post.image),
        video: post.video || null,
        author: author ? { 
          id: author.id,
          name: author.name, 
          avatar: safePublicUrl(req, author.avatar) 
        } : { name: "Người dùng không tồn tại", avatar: null },
        category_name: category ? category.name : "Chưa phân loại",
        category: category ? { id: category.id, name: category.name } : { name: "Chưa phân loại" }
      } 
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.updatePostStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!["pending", "approved", "hidden", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
    }

    const post = await Post.findOneAndUpdate(
      { id },
      { status },
      { new: true }
    );
    
    if (!post) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
    res.json({ success: true, data: post });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Post.findOneAndDelete({ id });

    if (!result) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
    res.json({ success: true, message: "Đã xóa thành công" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};