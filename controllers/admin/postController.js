const Post = require("../../models/Post");
const User = require("../../models/User");
const Category = require("../../models/Category"); 
const { toPublicUrl } = require("../../utils/imageHelper");

exports.getAdminPosts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 50);
    const q = (req.query.q || "").trim();
    const status = (req.query.status || "").trim();
    const category_id = (req.query.category_id || "").trim(); 

    const filter = {};
    if (q) {
      filter.$or = [{ title: new RegExp(q, "i") }, { description: new RegExp(q, "i") }];
    }
    if (["pending", "approved", "hidden"].includes(status)) filter.status = status;
    if (category_id) filter.category_id = category_id; 

    const total = await Post.countDocuments(filter);
    const rows = await Post.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const userIds = [...new Set(rows.map(r => r.user_id?.toString()).filter(Boolean))];
    const users = await User.find({ 
      $or: [{ _id: { $in: userIds } }, { id: { $in: userIds } }] 
    }).select("id _id name avatar").lean();

    const userMap = new Map();
    users.forEach(u => {
      if (u._id) userMap.set(u._id.toString(), u);
      if (u.id) userMap.set(u.id.toString(), u);
    });

    const categoryIds = [...new Set(rows.map(r => r.category_id?.toString()).filter(Boolean))];
    const categories = await Category.find({ 
      $or: [{ _id: { $in: categoryIds } }, { id: { $in: categoryIds } }] 
    }).select("id _id name").lean();

    const categoryMap = new Map();
    categories.forEach(c => {
      if (c._id) categoryMap.set(c._id.toString(), c);
      if (c.id) categoryMap.set(c.id.toString(), c);
    });

    const items = rows.map(p => {
      const userIdStr = p.user_id?.toString();
      const catIdStr = p.category_id?.toString();
      
      const au = userMap.get(userIdStr);
      const cat = categoryMap.get(catIdStr); 
      
      return {
        ...p,
        image: toPublicUrl(req, p.image),
        author: au ? { ...au, avatar: toPublicUrl(req, au.avatar) } : null,
        category: cat || { name: "Chưa phân loại" }, 
      };
    });

    res.status(200).json({ success: true, data: { page, limit, total, items } });
  } catch (e) {
    console.error("DEBUG ADMIN GET POSTS:", e);
    res.status(500).json({ success: false, message: e.message || "Lỗi Server" });
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
      { $or: [{ _id: id.length === 24 ? id : null }, { id: id }] },
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
      $or: [{ _id: id.length === 24 ? id : null }, { id: id }]
    });

    if (!result) return res.status(404).json({ success: false, message: "Không tìm thấy bài" });
    res.json({ success: true, message: "Đã xóa thành công" });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi khi xóa" });
  }
};