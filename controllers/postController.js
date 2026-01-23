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

    const userIds = [...new Set(posts.map(p => p.user_id).filter(Boolean))];
    const catIds = [...new Set(posts.map(p => p.category_id).filter(Boolean))];

    const [users, categories] = await Promise.all([
      User.find({ id: { $in: userIds } }).select("id name avatar").lean(),
      Category.find({ id: { $in: catIds } }).select("id name").lean()
    ]);

    const userMap = new Map(users.map(u => [u.id, u]));
    const catMap = new Map(categories.map(c => [c.id, c]));

    const items = posts.map(p => {
      const u = userMap.get(p.user_id);
      const c = catMap.get(p.category_id);
      
      return {
        ...p,
        likes: Number(p.likes || 0),
        image: toPublicUrl(req, p.image), 
        video: p.video || null, 
        author: u ? { ...u, avatar: toPublicUrl(req, u.avatar) } : null, 
        category_name: c ? c.name : "Chưa phân loại"
      };
    });

    res.json({ success: true, data: { items } });
  } catch (e) {
    console.error("Lỗi getPosts:", e);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

exports.getMyPosts = async (req, res) => {
  try {
    const finalUserId = String(req.user.id);

    const posts = await Post.find({ user_id: finalUserId })
      .sort({ created_at: -1 })
      .lean();

    const catIds = [...new Set(posts.map(p => p.category_id).filter(Boolean))];
    const categories = await Category.find({ id: { $in: catIds } }).select("id name").lean();
    const catMap = new Map(categories.map(c => [c.id, c]));

    const items = posts.map(p => {
      const c = catMap.get(p.category_id);
      return {
        ...p,
        likes: Number(p.likes || 0), 
        image: toPublicUrl(req, p.image),
        video: p.video || null,
        category_name: c ? c.name : "Chưa phân loại"
      };
    });

    res.json({ success: true, data: { items } });
  } catch (e) {
    console.error("Lỗi getMyPosts:", e);
    res.status(500).json({ success: false, message: "Không thể tải bài viết" });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { title, description, ingredients, steps, category_id } = req.body;

    if (!category_id) {
      return res.status(400).json({ success: false, message: "Vui lòng chọn danh mục món ăn" });
    }

    const finalUserId = String(req.user.id);
    const finalCategoryId = String(category_id);
    
    const isVideo = req.file && req.file.mimetype.startsWith('video');
    const fileUrl = req.file ? req.file.path : null;

    const postData = {
      id: `post-${Date.now()}`, 
      user_id: finalUserId,
      category_id: finalCategoryId,
      title,
      description,
      ingredients,
      steps,
      likes: 0,
      status: "approved", 
      post_type: isVideo ? "video" : "image" 
    };

    if (isVideo) {
      postData.video = fileUrl; 
      postData.image = req.body.thumbnail || null; 
    } else {
      postData.image = fileUrl; 
    }

    const post = await Post.create(postData);

    res.status(201).json({ success: true, data: post });
  } catch (e) {
    console.error("Lỗi tạo bài viết:", e);
    res.status(400).json({ success: false, message: "Không thể tạo bài viết" });
  }
};