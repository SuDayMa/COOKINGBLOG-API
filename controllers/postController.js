const Post = require("../models/Post");
const User = require("../models/User");
const Category = require("../models/Category");
const Follower = require("../models/Follower");
const { toPublicUrl } = require("../utils/imageHelper");
const Notification = require("../models/Notification");

// 1. Lấy danh sách bài viết
exports.getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, q = "", category_id, status = "approved" } = req.query;
    // Lấy ID người dùng hiện tại từ token (nếu có)
    const currentUserId = req.user ? String(req.user.id) : null;

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

    const items = posts.map(p => {
      // Giả sử mảng chứa ID những người đã like nằm ở p.likes (kiểu Array)
      const likesList = Array.isArray(p.likes) ? p.likes.map(id => String(id)) : [];
      
      return {
        ...p,
        id: p._id, 
        // 🔥 Trả về true nếu ID của mình nằm trong danh sách likes
        isLiked: currentUserId ? likesList.includes(currentUserId) : false,
        likesCount: likesList.length,
        images: (p.images || []).map(img => toPublicUrl(req, img)),
        video: p.video ? toPublicUrl(req, p.video) : null,
        author: p.user_id ? { ...p.user_id, avatar: toPublicUrl(req, p.user_id.avatar) } : null,
        category_name: p.category_id ? p.category_id.name : "Chưa phân loại"
      };
    });

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
    const currentUserId = req.user ? String(req.user.id) : null;

    const post = await Post.findById(id)
      .populate("user_id", "name avatar")
      .populate("category_id", "name")
      .lean();

    if (!post) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
    }

    const likesList = Array.isArray(post.likes) ? post.likes.map(id => String(id)) : [];

    const data = {
      ...post,
      id: post._id,
      isLiked: currentUserId ? likesList.includes(currentUserId) : false,
      likesCount: likesList.length,
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

    // 1. Lưu bài viết vào DB
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

    
    await Notification.create({
      id: `pending-${Date.now()}`,
      recipient_id: String(user_id || req.user.id),
      kind: 'post_pending', // Loại này Sự đã thêm vào Enum trong Model rồi đúng không?
      post_id: String(post._id),
      post_title: post.title,
      post_image: imageUrls.length > 0 ? imageUrls[0] : null,
      content: "Bài viết của bạn đã được gửi và đang chờ quản trị viên phê duyệt.",
      read: false
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
    const myId = String(req.user.id || req.user._id);

    const followingList = await Follower.find({ follower_id: myId }).lean();
    
    if (!followingList || followingList.length === 0) {
      return res.json({ success: true, data: { items: [] } });
    }

    const followingIds = followingList.map(f => String(f.following_id));

    const posts = await Post.find({ 
      user_id: { $in: followingIds }, 
      status: "approved" 
    })
    .populate("user_id", "name avatar") 
    .populate("category_id", "name")
    .sort({ created_at: -1 })
    .lean();

    const items = posts.map(p => {
      const likesList = Array.isArray(p.likes) ? p.likes.map(id => String(id)) : [];
      return {
        ...p,
        id: p._id,
        isLiked: likesList.includes(myId),
        likesCount: likesList.length,
        images: (p.images || []).map(img => toPublicUrl(req, img)),
        video: p.video ? toPublicUrl(req, p.video) : null,
        author: p.user_id ? { 
          ...p.user_id, 
          avatar: toPublicUrl(req, p.user_id.avatar) 
        } : null,
        category_name: p.category_id ? p.category_id.name : "Chưa phân loại"
      };
    });

    res.json({ success: true, data: { items } });

  } catch (e) {
    console.error("🔥 LỖI CHI TIẾT:", e); 
    res.status(500).json({ 
      success: false, 
      message: "Lỗi lấy bài viết theo dõi"
    });
  }
};
