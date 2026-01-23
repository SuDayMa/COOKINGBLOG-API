const Post = require("../models/Post");
const User = require("../models/User");
const Category = require("../models/Category");
const { toPublicUrl } = require("../utils/imageHelper");

// 1. Lấy danh sách bài viết 
exports.getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, q = "", category_id, status = "approved" } = req.query;

    const filter = { status };
    if (category_id) filter.category_id = category_id;
    if (q) {
      filter.$or = [
        { title: new RegExp(q, "i") },
        { description: new RegExp(q, "i") }
      ];
    }

    const posts = await Post.find(filter)
      .populate("user_id", "name avatar") 
      .populate("category_id", "name")   
      .sort({ created_at: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const items = posts.map(p => ({
      ...p,
      id: p._id, 
      images: p.images?.map(img => toPublicUrl(req, img)) || [],
      video: p.video || null,
      author: p.user_id ? { ...p.user_id, avatar: toPublicUrl(req, p.user_id.avatar) } : null,
      category_name: p.category_id ? p.category_id.name : "Chưa phân loại"
    }));

    res.json({ success: true, data: { items } });
  } catch (e) {
    console.error("Lỗi getPosts:", e.message);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

// 2. Lấy bài viết của chính tôi
exports.getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ user_id: req.user.id })
      .populate("category_id", "name")
      .sort({ created_at: -1 })
      .lean();

    const items = posts.map(p => ({
      ...p,
      id: p._id,
      images: p.images?.map(img => toPublicUrl(req, img)) || [],
      category_name: p.category_id ? p.category_id.name : "Chưa phân loại"
    }));

    res.json({ success: true, data: { items } });
  } catch (e) {
    res.status(500).json({ success: false, message: "Không thể tải bài viết" });
  }
};

// 3. Tạo bài viết mới (Nhiều ảnh + 1 Video)
exports.createPost = async (req, res) => {
  try {
    const { title, description, ingredients, steps, category_id } = req.body;

    if (!category_id) {
      return res.status(400).json({ success: false, message: "Vui lòng chọn danh mục" });
    }

    let imageUrls = [];
    if (req.files && req.files["images"]) {
      imageUrls = req.files["images"].map(file => file.path);
    }

    let videoUrl = null;
    if (req.files && req.files["video"]) {
      videoUrl = req.files["video"][0].path;
    }

    const post = await Post.create({
      user_id: req.user.id,
      category_id: category_id,
      title,
      description,
      ingredients: typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients,
      steps: typeof steps === 'string' ? JSON.parse(steps) : steps,
      images: imageUrls,
      video: videoUrl,
      status: "approved" 
    });

    res.status(201).json({ success: true, data: post });
  } catch (e) {
    console.error("Lỗi tạo bài viết:", e.message);
    res.status(400).json({ success: false, message: "Dữ liệu không hợp lệ" });
  }
};