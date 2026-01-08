const Post = require("../models/Post");
const User = require("../models/User");
const Category = require("../models/Category");
const { toPublicUrl } = require("../utils/imageHelper");
const mongoose = require("mongoose"); 

exports.getPosts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      q = "", 
      category_id = "", 
      status = "approved" 
    } = req.query;

    const filter = { status };

    if (category_id) {
      filter.category_id = String(category_id);
    }

    if (q) {
      filter.$or = [
        { title: new RegExp(q, "i") }, 
        { description: new RegExp(q, "i") }
      ];
    }

    const posts = await Post.find(filter)
      .sort({ created_at: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const userIds = [...new Set(posts.map(p => p.user_id?.toString()).filter(Boolean))];
    const catIds = [...new Set(posts.map(p => p.category_id?.toString()).filter(Boolean))];

    const [users, categories] = await Promise.all([
      User.find({ 
        $or: [
          { _id: { $in: userIds.filter(id => mongoose.Types.ObjectId.isValid(id)) } },
          { id: { $in: userIds } }
        ]
      }).select("id _id name avatar").lean(),
      Category.find({ 
        $or: [
          { _id: { $in: catIds.filter(id => mongoose.Types.ObjectId.isValid(id)) } },
          { id: { $in: catIds } }
        ]
      }).select("id _id name").lean()
    ]);

    const userMap = new Map();
    users.forEach(u => {
      if (u._id) userMap.set(u._id.toString(), u);
      if (u.id) userMap.set(u.id.toString(), u);
    });

    const catMap = new Map();
    categories.forEach(c => {
      if (c._id) catMap.set(c._id.toString(), c);
      if (c.id) catMap.set(c.id.toString(), c);
    });

    const items = posts.map(p => {
      const u = userMap.get(p.user_id?.toString());
      const c = catMap.get(p.category_id?.toString());
      
      return {
        ...p,
        image: toPublicUrl(req, p.image), 
        user: u ? { ...u, avatar: toPublicUrl(req, u.avatar) } : null,
        category_name: c ? c.name : "Chưa phân loại"
      };
    });

    res.json({ success: true, data: { items } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { title, description, ingredients, steps, category_id } = req.body;

    if (!category_id) {
      return res.status(400).json({ success: false, message: "Vui lòng chọn danh mục món ăn" });
    }
    const finalUserId = String(req.user._id || req.user.id);
    const finalCategoryId = String(category_id);

    const post = await Post.create({
      user_id: finalUserId, 
      category_id: finalCategoryId, 
      title,
      description,
      image: req.file ? req.file.path : req.body.image, 
      ingredients,
      steps,
      status: "pending" 
    });

    res.status(201).json({ success: true, data: post });
  } catch (e) {
    console.error("Lỗi tạo bài viết:", e); 
    res.status(400).json({ success: false, message: e.message || "Không thể tạo bài viết" });
  }
};