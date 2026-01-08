const SavedPost = require("../models/SavedPost");
const Post = require("../models/Post");
const { toPublicUrl } = require("../utils/imageHelper");
const mongoose = require("mongoose");

exports.toggleSave = async (req, res) => {
  try {
    const { postId } = req.body; 
    if (!postId) return res.status(400).json({ success: false, message: "Thiếu postId" });

    const post = await Post.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(postId) ? postId : null },
        { id: postId }
      ].filter(Boolean)
    });

    if (!post) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
    }

    const finalPostId = String(post.id || post._id);
    const userId = String(req.user.id || req.user._id);

    const exists = await SavedPost.findOne({ 
      user_id: userId, 
      post_id: finalPostId 
    });

    let updatedPost;

    if (exists) {
      await SavedPost.deleteOne({ _id: exists._id });
      
      updatedPost = await Post.findByIdAndUpdate(
        post._id,
        { $inc: { likes: -1 } },
        { new: true }
      );
    } else {
      await SavedPost.create({ 
        user_id: userId, 
        post_id: finalPostId 
      });

      updatedPost = await Post.findOneAndUpdate(
        { _id: post._id },
        [
          {
            $set: {
              likes: {
                $add: [{ $ifNull: ["$likes", 0] }, 1]
              }
            }
          }
        ],
        { new: true }
      );
    }

    const finalLikes = updatedPost && updatedPost.likes ? Math.max(0, updatedPost.likes) : (exists ? 0 : 1);

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
    console.error("Lỗi Toggle Save:", e);
    res.status(500).json({ success: false, message: "Lỗi hệ thống xử lý Tim" });
  }
};

exports.getSavedPosts = async (req, res) => {
  try {
    const userId = String(req.user.id || req.user._id);
    const page = Math.max(parseInt(req.query.page || "1"), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "10"), 1), 50);

    const total = await SavedPost.countDocuments({ user_id: userId });
    const savedRecords = await SavedPost.find({ user_id: userId })
      .sort({ saved_at: -1 }) 
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const postIds = savedRecords.map(s => s.post_id);
    
    const posts = await Post.find({ 
      $or: [
        { _id: { $in: postIds.filter(id => mongoose.Types.ObjectId.isValid(id)) } },
        { id: { $in: postIds } }
      ]
    }).select("id _id title image likes category_name status").lean();

    const map = new Map();
    posts.forEach(p => {
        if (p._id) map.set(p._id.toString(), p);
        if (p.id) map.set(p.id, p);
    });

    const items = savedRecords
      .map(s => {
        const p = map.get(s.post_id);
        if (!p) return null;
        return {
          ...p,
          id: p.id || p._id.toString(), 
          likes: p.likes || 0, 
          image: toPublicUrl(req, p.image) 
        };
      })
      .filter(Boolean);

    res.json({ success: true, data: { page, limit, total, items } });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi Server tải danh sách" });
  }
};

exports.checkSaved = async (req, res) => {
  try {
    const userId = String(req.user.id || req.user._id);
    const { postId } = req.params;

    const exists = await SavedPost.findOne({ 
      user_id: userId, 
      post_id: String(postId) 
    });

    res.json({ 
      success: true, 
      data: { postId, saved: !!exists } 
    });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi kiểm tra" });
  }
};