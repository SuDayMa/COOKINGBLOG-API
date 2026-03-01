const SavedPost = require("../models/SavedPost");
const Post = require("../models/Post");
const Notification = require("../models/Notification");
const { toPublicUrl } = require("../utils/imageHelper");
const mongoose = require("mongoose");

// 1. TOGGLE LIKE/SAVE (Cập nhật để đồng bộ màu sắc Frontend)
exports.toggleSave = async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.user.id;

    if (!postId) {
      return res.status(400).json({ success: false, message: "Thiếu postId" });
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ success: false, message: "ID bài viết không hợp lệ" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
    }

    const exists = await SavedPost.findOne({ 
      user_id: userId, 
      post_id: postId 
    });

    let updatedPost;
    let isNowSaved = false; // Biến trạng thái để trả về cho Client

    if (exists) {
      // TRƯỜNG HỢP: BỎ LIKE/LƯU
      await SavedPost.deleteOne({ _id: exists._id });
      isNowSaved = false; 
      
      updatedPost = await Post.findByIdAndUpdate(
        postId,
        { $inc: { likes: -1 } },
        { new: true }
      );
    } else {
      // TRƯỜNG HỢP: LIKE/LƯU MỚI
      await SavedPost.create({ 
        user_id: userId, 
        post_id: postId,
        saved_at: new Date()
      });
      isNowSaved = true;

      updatedPost = await Post.findByIdAndUpdate(
        postId,
        { $inc: { likes: 1 } },
        { new: true }
      );

      // TẠO THÔNG BÁO (Giữ nguyên logic của Sự)
      if (String(post.author_id || post.user_id) !== String(userId)) {
        await Notification.create({
          id: Date.now().toString(),
          recipient_id: String(post.author_id || post.user_id),
          actor_id: String(userId),
          kind: 'like',
          post_id: String(postId),
          post_title: post.title,
          post_image: Array.isArray(post.images) ? post.images[0] : post.image,
          content: "đã thích bài viết của bạn",
          read: false
        });
      }
    }

    const finalLikes = updatedPost && typeof updatedPost.likes === 'number' 
      ? Math.max(0, updatedPost.likes) 
      : 0;

    // TRẢ VỀ DỮ LIỆU ĐỂ FRONTEND CẬP NHẬT TRẠNG THÁI TIM NGAY LẬP TỨC
    return res.json({ 
      success: true, 
      message: isNowSaved ? "Đã lưu bài viết" : "Đã bỏ lưu", 
      data: { 
        postId: postId,
        saved: isNowSaved, // Trạng thái true/false để Client tô màu
        likes: finalLikes
      } 
    });

  } catch (e) {
    console.error("❌ Lỗi Toggle Save:", e.message);
    res.status(500).json({ 
      success: false, 
      message: "Lỗi hệ thống: " + e.message 
    });
  }
};

// 2. LẤY DANH SÁCH BÀI VIẾT ĐÃ LƯU (Giữ nguyên)
exports.getSavedPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(parseInt(req.query.page || "1"), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "10"), 1), 50);

    const total = await SavedPost.countDocuments({ user_id: userId });
    const savedRecords = await SavedPost.find({ user_id: userId })
      .sort({ saved_at: -1 }) 
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const postIds = savedRecords.map(s => s.post_id);
    const posts = await Post.find({ _id: { $in: postIds } })
      .select("title image video post_type likes status")
      .lean();

    const postMap = new Map(posts.map(p => [String(p._id), p]));

    const items = savedRecords
      .map(s => {
        const p = postMap.get(String(s.post_id));
        if (!p) return null;
        return {
          ...p,
          id: p._id,
          image: toPublicUrl(req, p.image),
          video: p.video || null,
          saved: true 
        };
      })
      .filter(Boolean);

    res.json({ 
      success: true, 
      data: { page, limit, total, items } 
    });
  } catch (e) {
    console.error("❌ Lỗi getSavedPosts:", e.message);
    res.status(500).json({ success: false, message: "Lỗi tải danh sách bài đã lưu" });
  }
};

// 3. KIỂM TRA TRẠNG THÁI LƯU (Giữ nguyên)
exports.checkSaved = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ success: false, message: "ID không hợp lệ" });
    }

    const exists = await SavedPost.findOne({ 
      user_id: userId, 
      post_id: postId 
    });

    res.json({ 
      success: true, 
      data: { postId, saved: !!exists } 
    });
  } catch (e) {
    console.error("❌ Lỗi checkSaved:", e.message);
    res.status(500).json({ success: false, message: "Lỗi kiểm tra trạng thái lưu" });
  }
};