const Post = require("../../models/Post");
const User = require("../../models/User");
const Category = require("../../models/Category");
const { toPublicUrl } = require("../../utils/imageHelper");
const mongoose = require("mongoose");
const safePublicUrl = (req, path) => {
  try {
    if (!path || typeof path !== 'string') return null;
    
    return toPublicUrl(req, path);
  } catch (err) {
    console.warn("Lỗi format ảnh:", err.message);
    return null;
  }
};

exports.getAdminPosts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);
    const status = (req.query.status || "").trim();

    const filter = {};
    if (["pending", "approved", "hidden"].includes(status)) filter.status = status;

    const total = await Post.countDocuments(filter);
    const rows = await Post.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const userIds = [...new Set(rows.map(r => r.user_id?.toString()).filter(Boolean))];
    const categoryIds = [...new Set(rows.map(r => r.category_id?.toString()).filter(Boolean))];

    const [users, categories] = await Promise.all([
      User.find({ 
        $or: [
          { _id: { $in: userIds.filter(id => mongoose.Types.ObjectId.isValid(id)) } }, 
          { id: { $in: userIds } }
        ] 
      }).select("id _id name avatar").lean(),
      Category.find({ 
        $or: [
          { _id: { $in: categoryIds.filter(id => mongoose.Types.ObjectId.isValid(id)) } }, 
          { id: { $in: categoryIds } }
        ] 
      }).select("id _id name").lean()
    ]);

    const userMap = new Map();
    users.forEach(u => {
      if (u._id) userMap.set(u._id.toString(), u);
      if (u.id) userMap.set(u.id.toString(), u);
    });

    const categoryMap = new Map();
    categories.forEach(c => {
      if (c._id) categoryMap.set(c._id.toString(), c);
      if (c.id) categoryMap.set(c.id.toString(), c);
    });

    const items = rows.map(p => {
      const u = userMap.get(p.user_id?.toString());
      const c = categoryMap.get(p.category_id?.toString()); 
      
      return {
        ...p,
        image: safePublicUrl(req, p.image),
        author: u ? { 
          id: u.id || u._id.toString(),
          name: u.name || "Người dùng không tên", 
          avatar: safePublicUrl(req, u.avatar) 
        } : { name: "N/A", avatar: null },
        category_name: c ? c.name : "Chưa phân loại",
        category: c ? { id: c.id || c._id, name: c.name } : { name: "Chưa phân loại" }
      };
    });

    res.status(200).json({ success: true, data: { page, limit, total, items } });
  } catch (e) {
    console.error("CRITICAL ADMIN ERROR:", e);
    res.status(500).json({ success: false, message: "Lỗi hệ thống: " + e.message });
  }
};

exports.getAdminPostDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await Post.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(id) ? id : null },
        { id: id }
      ].filter(Boolean)
    }).lean();

    if (!post) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });

    const [author, category] = await Promise.all([
      User.findOne({ 
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(post.user_id) ? post.user_id : null }, 
          { id: post.user_id }
        ].filter(Boolean)
      }).select("id _id name avatar").lean(),
      Category.findOne({
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(post.category_id) ? post.category_id : null }, 
          { id: post.category_id }
        ].filter(Boolean)
      }).select("id _id name").lean()
    ]);

    res.json({ 
      success: true, 
      data: { 
        ...post, 
        image: safePublicUrl(req, post.image),
        author: author ? { 
          id: author.id || author._id.toString(),
          name: author.name, 
          avatar: safePublicUrl(req, author.avatar) 
        } : { name: "N/A", avatar: null },
        category_name: category ? category.name : "Chưa phân loại",
        category: category ? { id: category.id || category._id, name: category.name } : { name: "Chưa phân loại" }
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

    if (!["pending", "approved", "hidden"].includes(status)) {
      return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
    }

    const post = await Post.findOneAndUpdate(
      { $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { id: id }].filter(Boolean) },
      { status },
      { new: true }
    );
    
    if (!post) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
    res.json({ success: true, data: post });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi cập nhật: " + e.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Post.findOneAndDelete({
      $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { id: id }].filter(Boolean)
    });

    if (!result) return res.status(404).json({ success: false, message: "Không tìm thấy bài" });
    res.json({ success: true, message: "Đã xóa thành công" });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi xóa: " + e.message });
  }
};