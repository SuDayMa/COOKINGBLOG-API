const Post = require("../models/Post");
const User = require("../models/User");
const Category = require("../models/Category");
const { toPublicUrl } = require("../utils/imageHelper");

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

    if (q) {
      filter.$or = [
        { title: new RegExp(q, "i") }, 
        { description: new RegExp(q, "i") }
      ];
    }

    if (category_id) {
      filter.category_id = category_id;
    }

    const posts = await Post.find(filter)
      .sort({ created_at: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const userIds = [...new Set(posts.map(p => p.user_id).filter(Boolean))];
    const users = await User.find({ id: { $in: userIds } }).select("id name avatar").lean();
    const userMap = new Map(users.map(u => [u.id, u]));

    const catIds = [...new Set(posts.map(p => p.category_id).filter(Boolean))];
    const categories = await Category.find({ id: { $in: catIds } }).select("id name").lean();
    const catMap = new Map(categories.map(c => [c.id, c]));

    const items = posts.map(p => {
      const u = userMap.get(p.user_id);
      const c = catMap.get(p.category_id);
      
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
    const { title, description, image, ingredients, steps, category_id } = req.body;

    if (!category_id) {
      return res.status(400).json({ success: false, message: "Vui lòng chọn danh mục món ăn" });
    }

    const post = await Post.create({
      user_id: req.user.id,
      category_id, 
      title,
      description,
      image: req.file ? req.file.path : image, 
      ingredients,
      steps,
      status: "pending" 
    });

    res.status(201).json({ success: true, data: post });
  } catch (e) {
    res.status(400).json({ success: false, message: "Không thể tạo bài viết" });
  }
};