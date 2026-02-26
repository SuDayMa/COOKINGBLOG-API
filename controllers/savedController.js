const SavedPost = require("../models/SavedPost");
const Post = require("../models/Post");
const { toPublicUrl } = require("../utils/imageHelper");
const mongoose = require("mongoose");

// 1. TOGGLE LIKE/SAVE (Thả tim & Lưu)
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

    // Tìm bài viết
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
    }

    const exists = await SavedPost.findOne({ 
      user_id: userId, 
      post_id: postId 
    });

    let updatedPost;

    if (exists) {
      await SavedPost.deleteOne({ _id: exists._id });
      
      updatedPost = await Post.findByIdAndUpdate(
        postId,
        { $inc: { likes: -1 } },
        { new: true }
      );
    } else {
      await SavedPost.create({ 
        user_id: userId, 
        post_id: postId,
        saved_at: new Date()
      });

      updatedPost = await Post.findByIdAndUpdate(
        postId,
        { $inc: { likes: 1 } },
        { new: true }
      );
    }

    const finalLikes = updatedPost && typeof updatedPost.likes === 'number' 
      ? Math.max(0, updatedPost.likes) 
      : 0;

    return res.json({ 
      success: true, 
      message: exists ? "Đã bỏ lưu" : "Đã lưu bài viết", 
      data: { 
        postId: postId,
        saved: !exists, 
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

// 2. LẤY DANH SÁCH BÀI VIẾT ĐÃ LƯU (Có phân trang)
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
    
    // Lấy thông tin bài viết từ danh sách ID đã lưu
    const posts = await Post.find({ _id: { $in: postIds } })
      .select("title image video post_type likes status")
      .lean();

    // Tạo Map để map bài viết vào bản ghi lưu nhanh hơn
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

// 3. KIỂM TRA TRẠNG THÁI LƯU CỦA 1 BÀI VIẾT
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