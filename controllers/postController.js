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
      // Đảm bảo images luôn là mảng để App không bị crash
      images: (p.images || []).map(img => toPublicUrl(req, img)),
      video: p.video || null,
      author: p.user_id ? { ...p.user_id, avatar: toPublicUrl(req, p.user_id.avatar) } : null,
      category_name: p.category_id ? p.category_id.name : "Chưa phân loại"
    }));

    res.json({ success: true, data: { items } });
  } catch (e) {
    console.error("🔥 Lỗi getPosts:", e.message);
    res.status(500).json({ success: false, message: "Lỗi hệ đồng bộ dữ liệu" });
  }
};

// 2. Tạo bài viết mới (Fix lỗi JSON.parse)
exports.createPost = async (req, res) => {
  try {
    const { title, description, ingredients, steps, category_id, user_id } = req.body;

    // Kiểm tra danh mục
    if (!category_id) {
      return res.status(400).json({ success: false, message: "Vui lòng chọn danh mục" });
    }

    // Xử lý ảnh từ upload.fields([{ name: 'images' }])
    let imageUrls = [];
    if (req.files && req.files["images"]) {
      imageUrls = req.files["images"].map(file => file.path);
    }

    // Xử lý video từ upload.fields([{ name: 'video' }])
    let videoUrl = null;
    if (req.files && req.files["video"]) {
      videoUrl = req.files["video"][0].path;
    }

    // FIX LỖI 500: Kiểm tra an toàn trước khi Parse JSON
    const safeParse = (data) => {
      try {
        if (typeof data === 'string' && (data.startsWith('[') || data.startsWith('{'))) {
          return JSON.parse(data);
        }
        return data; // Trả về text thuần nếu không phải JSON
      } catch (err) {
        return data;
      }
    };

    const post = await Post.create({
      // Ưu tiên user_id từ body nếu có (do App gửi), nếu không lấy từ token
      user_id: user_id || req.user.id,
      category_id,
      title,
      description,
      ingredients: safeParse(ingredients),
      steps: safeParse(steps),
      images: imageUrls,
      video: videoUrl,
      status: "approved" // Tạm thời để approved để test cho nhanh
    });

    res.status(201).json({ success: true, data: post });
  } catch (e) {
    console.error("🔥 Lỗi tạo bài viết:", e);
    res.status(500).json({ 
      success: false, 
      message: "Lỗi máy chủ nội bộ",
      error: e.message 
    });
  }
};

// 3. Lấy bài viết của chính tôi
exports.getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ user_id: req.user.id })
      .populate("category_id", "name")
      .sort({ created_at: -1 })
      .lean();

    const items = posts.map(p => ({
      ...p,
      id: p._id,
      images: (p.images || []).map(img => toPublicUrl(req, img)),
      category_name: p.category_id ? p.category_id.name : "Chưa phân loại"
    }));

    res.json({ success: true, data: { items } });
  } catch (e) {
    res.status(500).json({ success: false, message: "Không thể tải bài viết" });
  }
};