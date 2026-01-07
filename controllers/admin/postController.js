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

 
    const userIds = [...new Set(rows.map(r => r.user_id).filter(Boolean))];
    const users = await User.find({ id: { $in: userIds } }).select("id name avatar").lean();
    const userMap = new Map(users.map(u => [u.id, u]));


    const categoryIds = [...new Set(rows.map(r => r.category_id).filter(Boolean))];
    const categories = await Category.find({ id: { $in: categoryIds } }).select("id name").lean();
    const categoryMap = new Map(categories.map(c => [c.id, c]));

    const items = rows.map(p => {
      const au = userMap.get(p.user_id);
      const cat = categoryMap.get(p.category_id); 
      
      return {
        ...p,
        image: toPublicUrl(req, p.image),
        author: au ? { ...au, avatar: toPublicUrl(req, au.avatar) } : null,
        category: cat || { name: "Chưa phân loại" }, 
      };
    });

    res.status(200).json({ success: true, data: { page, limit, total, items } });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

exports.updatePostStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "approved", "hidden"].includes(status)) {
      return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
    }
    const post = await Post.findOneAndUpdate({ id: req.params.id }, { status }, { new: true });
    if (!post) return res.status(404).json({ success: false, message: "Không tìm thấy bài" });
    res.json({ success: true, data: { id: post.id, status: post.status } });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi cập nhật" });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const result = await Post.deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ success: false, message: "Không tìm thấy bài" });
    res.json({ success: true, message: "Đã xóa thành công" });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi khi xóa" });
  }
};