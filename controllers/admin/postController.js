const Post = require("../../models/Post");
const User = require("../../models/User");
const Category = require("../../models/Category"); 
const { toPublicUrl } = require("../../utils/imageHelper");

exports.getAdminPosts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "20", 10), 1);
    const q = (req.query.q || "").trim();
    const status = (req.query.status || "").trim();
    const category_id = (req.query.category_id || "").trim(); 

    const filter = {};
    if (q) {
      filter.$or = [{ title: new RegExp(q, "i") }, { description: new RegExp(q, "i") }];
    }
    if (["pending", "approved", "hidden"].includes(status)) {
        filter.status = status;
    }
    if (category_id) filter.category_id = category_id; 

    const total = await Post.countDocuments(filter);
    const rows = await Post.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const userIds = [...new Set(rows.map(r => r.user_id?.toString()).filter(Boolean))];
    const categoryIds = [...new Set(rows.map(r => r.category_id?.toString()).filter(Boolean))];

    const [users, categories] = await Promise.all([
      User.find({ $or: [{ _id: { $in: userIds } }, { id: { $in: userIds } }] }).select("id _id name avatar").lean(),
      Category.find({ $or: [{ _id: { $in: categoryIds } }, { id: { $in: categoryIds } }] }).select("id _id name").lean()
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
      const cat = categoryMap.get(p.category_id?.toString()); 
      
      return {
        ...p,
        image: p.image ? toPublicUrl(req, p.image) : null,
        author: u ? { 
            name: u.name, 
            avatar: u.avatar ? toPublicUrl(req, u.avatar) : null 
        } : { name: "N/A", avatar: null },
        category: cat ? { id: cat._id || cat.id, name: cat.name } : { name: "Chưa phân loại" }, 
      };
    });

    res.status(200).json({ 
        success: true, 
        data: { 
            items, 
            total, 
            page, 
            limit,
            totalPages: Math.ceil(total / limit)
        } 
    });
  } catch (e) {
    console.error("CRITICAL ERROR ADMIN POSTS:", e);
    res.status(500).json({ success: false, message: "Lỗi Server: " + e.message });
  }
};