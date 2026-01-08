const Post = require("../../models/Post");
const User = require("../../models/User");
const Category = require("../../models/Category");
const { toPublicUrl } = require("../../utils/imageHelper");
const mongoose = require("mongoose");

exports.getAdminPosts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);
    const status = (req.query.status || "").trim();

    const filter = {};
    if (["pending", "approved", "hidden"].includes(status)) filter.status = status;

    const rows = await Post.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const userIds = [...new Set(rows.map(r => r.user_id?.toString()).filter(Boolean))];
    const categoryIds = [...new Set(rows.map(r => r.category_id?.toString()).filter(Boolean))];

    const validUserObjectIds = userIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    const validCategoryObjectIds = categoryIds.filter(id => mongoose.Types.ObjectId.isValid(id));

    const [users, categories] = await Promise.all([
      User.find({ 
        $or: [{ _id: { $in: validUserObjectIds } }, { id: { $in: userIds } }] 
      }).select("id _id name avatar").lean(),
      Category.find({ 
        $or: [{ _id: { $in: validCategoryObjectIds } }, { id: { $in: categoryIds } }] 
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
        image: p.image ? toPublicUrl(req, p.image) : null,
        author: u ? { 
          name: u.name, 
          avatar: u.avatar ? toPublicUrl(req, u.avatar) : null 
        } : { name: "N/A" },
        category: c ? { name: c.name } : { name: "Chưa phân loại" }, 
      };
    });

    res.status(200).json({ success: true, data: { page, limit, total: await Post.countDocuments(filter), items } });
  } catch (e) {
    console.error("CRITICAL ERROR:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getAdminPostDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findOne({
      $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { id: id }].filter(Boolean)
    }).lean();

    if (!post) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });

    const author = await User.findOne({ 
      $or: [{ _id: mongoose.Types.ObjectId.isValid(post.user_id) ? post.user_id : null }, { id: post.user_id }].filter(Boolean)
    }).select("name avatar").lean();

    res.json({ 
      success: true, 
      data: { ...post, image: toPublicUrl(req, post.image), author: author ? { ...author, avatar: toPublicUrl(req, author.avatar) } : null } 
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};