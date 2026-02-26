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
      images: (p.images || []).map(img => toPublicUrl(req, img)),
      video: p.video ? toPublicUrl(req, p.video) : null,
      author: p.user_id ? { ...p.user_id, avatar: toPublicUrl(req, p.user_id.avatar) } : null,
      category_name: p.category_id ? p.category_id.name : "Chưa phân loại"
    }));

    res.json({ success: true, data: { items } });
  } catch (e) {
    console.error("🔥 Lỗi getPosts:", e.message);
    res.status(500).json({ success: false, message: "Lỗi đồng bộ dữ liệu" });
  }
};

// 🔥 2. MỚI: Lấy chi tiết bài viết 
exports.getPostDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id)
      .populate("user_id", "name avatar")
      .populate("category_id", "name")
      .lean();

    if (!post) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
    }

    // Format dữ liệu giống như getPosts để App dễ xử lý
    const data = {
      ...post,
      id: post._id,
      images: (post.images || []).map(img => toPublicUrl(req, img)),
      video: post.video ? toPublicUrl(req, post.video) : null,
      author: post.user_id ? { 
        ...post.user_id, 
        avatar: toPublicUrl(req, post.user_id.avatar) 
      } : null,
      category_name: post.category_id ? post.category_id.name : "Chưa phân loại"
    };

    res.json({ success: true, data });
  } catch (e) {
    console.error("🔥 Lỗi getPostDetail:", e.message);
    res.status(500).json({ success: false, message: "Lỗi máy chủ khi lấy chi tiết" });
  }
};

// 3. Tạo bài viết mới
exports.createPost = async (req, res) => {
  try {
    const { title, description, ingredients, steps, category_id, user_id } = req.body;

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

    const safeParse = (data) => {
      try {
        if (typeof data === 'string' && (data.startsWith('[') || data.startsWith('{'))) {
          return JSON.parse(data);
        }
        return data; 
      } catch (err) {
        return data;
      }
    };

    const post = await Post.create({
      user_id: user_id || req.user.id,
      category_id,
      title,
      description,
      ingredients: safeParse(ingredients),
      steps: safeParse(steps),
      images: imageUrls,
      video: videoUrl,  
      status: "pending" 
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

// 4. Lấy bài viết của chính tôi
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

exports.getFollowingPosts = async (req, res) => {
  try {
    // 1. Lấy ID của mình và ép kiểu String chắc chắn
    const myId = String(req.user.id || req.user._id);

    // 2. Tìm danh sách những người mình đang follow
    const followingList = await Follower.find({ follower_id: myId }).lean();
    
    if (!followingList || followingList.length === 0) {
      return res.json({ success: true, data: { items: [] } });
    }

    // 3. Lấy mảng ID 
    const followingIds = followingList.map(f => String(f.following_id));

    // 4. Truy vấn bài viết
    const posts = await Post.find({ 
      user_id: { $in: followingIds }, 
      status: "approved" 
    })
    .populate("user_id", "name avatar") 
    .populate("category_id", "name")
    .sort({ created_at: -1 })
    .lean();

    const items = posts.map(p => ({
      ...p,
      id: p._id,
      images: (p.images || []).map(img => toPublicUrl(req, img)),
      video: p.video ? toPublicUrl(req, p.video) : null,
      author: p.user_id ? { 
        ...p.user_id, 
        avatar: toPublicUrl(req, p.user_id.avatar) 
      } : null,
      category_name: p.category_id ? p.category_id.name : "Chưa phân loại"
    }));

    res.json({ success: true, data: { items } });

  } catch (e) {
    console.error("🔥 LỖI CHI TIẾT:", e); 
    res.status(500).json({ 
      success: false, 
      message: "Lỗi lấy bài viết theo dõi",
      debug: e.message
    });
  }
};