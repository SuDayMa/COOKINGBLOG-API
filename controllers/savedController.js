// controllers/savedController.js
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
    }).select("id _id");

    if (!post) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });

    const finalPostId = post.id || post._id.toString();
    const userId = req.user.id || req.user._id;

    const exists = await SavedPost.findOne({ user_id: userId, post_id: finalPostId });

    if (exists) {
      await SavedPost.deleteOne({ _id: exists._id });
      return res.json({ success: true, data: { postId: finalPostId, saved: false } });
    }

    await SavedPost.create({ user_id: userId, post_id: finalPostId });
    res.json({ success: true, data: { postId: finalPostId, saved: true } });
  } catch (e) {
    console.error("Lỗi Toggle Save:", e);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

exports.checkSaved = async (req, res) => {
  const userId = req.user.id || req.user._id;
  const exists = await SavedPost.findOne({ user_id: userId, post_id: req.params.postId });
  res.json({ success: true, data: { postId: req.params.postId, saved: !!exists } });
};