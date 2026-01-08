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

    const userId = String(req.user._id || req.user.id);
    const finalPostId = String(post._id || post.id);

    const exists = await SavedPost.findOne({ 
      user_id: userId, 
      post_id: finalPostId 
    });

    if (exists) {
      await SavedPost.deleteOne({ _id: exists._id });
      
      const updatedPost = await Post.findOneAndUpdate(
        { _id: post._id },
        { $inc: { likes: -1 } },
        { new: true }
      );

      return res.json({ 
        success: true, 
        message: "Đã bỏ lưu", 
        data: { 
          postId: finalPostId, 
          saved: false, 
          likes: updatedPost.likes || 0 
        } 
      });
    }

    await SavedPost.create({ 
      user_id: userId, 
      post_id: finalPostId 
    });

    const updatedPost = await Post.findOneAndUpdate(
      { _id: post._id },
      { $inc: { likes: 1 } },
      { new: true }
    );

    return res.json({ 
      success: true, 
      message: "Đã lưu bài viết", 
      data: { 
        postId: finalPostId, 
        saved: true, 
        likes: updatedPost.likes || 0 
      } 
    });

  } catch (e) {
    console.error("Lỗi Toggle Save:", e);
    res.status(500).json({ success: false, message: "Lỗi Server: " + e.message });
  }
};

exports.getSavedPosts = async (req, res) => {
  try {
    const userId = String(req.user._id || req.user.id);
    const page = Math.max(parseInt(req.query.page || "1"), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "10"), 1), 50);

    const total = await SavedPost.countDocuments({ user_id: userId });
    const saved = await SavedPost.find({ user_id: userId })
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const postIds = saved.map(s => s.post_id);
    
    const posts = await Post.find({ 
      $or: [
        { _id: { $in: postIds.filter(id => mongoose.Types.ObjectId.isValid(id)) } },
        { id: { $in: postIds } }
      ]
    }).select("id _id title image likes category_name").lean();

    const map = new Map();
    posts.forEach(p => {
        if (p._id) map.set(p._id.toString(), p);
        if (p.id) map.set(p.id, p);
    });

    const items = saved
      .map(s => {
        const p = map.get(s.post_id);
        if (!p) return null;
        return {
          ...p,
          id: p._id.toString(), 
          image: toPublicUrl(req, p.image) 
        };
      })
      .filter(Boolean);

    res.json({ success: true, data: { page, limit, total, items } });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

exports.checkSaved = async (req, res) => {
  try {
    const userId = String(req.user._id || req.user.id);
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
    res.status(500).json({ success: false, message: e.message });
  }
};