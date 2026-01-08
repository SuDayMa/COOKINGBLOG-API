const Comment = require("../models/Comment");
const Post = require("../models/Post");
const Notification = require("../models/Notification");
const mongoose = require("mongoose");

// --- THÊM HÀM LẤY DANH SÁCH BÌNH LUẬN ---
exports.getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.query; // Nhận từ ?postId=...
    if (!postId) return res.status(400).json({ success: false, message: "Thiếu postId" });

    const comments = await Comment.find({ post_id: postId })
      .populate("user_id", "name avatar") // Tự động lấy tên và ảnh từ bảng Users
      .sort({ created_at: -1 }) // Bình luận mới nhất lên đầu
      .lean();

    res.json({ success: true, data: comments });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi khi lấy bình luận" });
  }
};

exports.createComment = async (req, res) => {
  try {
    const { postId, content } = req.body;
    if (!postId || !content) {
      return res.status(400).json({ success: false, message: "Thiếu postId hoặc nội dung" });
    }

    const post = await Post.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(postId) ? postId : null },
        { id: postId }
      ].filter(Boolean)
    });

    if (!post) return res.status(404).json({ success: false, message: "Bài viết không tồn tại" });

    const cmt = await Comment.create({
      post_id: postId,
      user_id: req.user._id || req.user.id, 
      content,
      status: "visible",
    });

    const currentUserId = String(req.user._id || req.user.id);
    if (String(post.user_id) !== currentUserId) {
      await Notification.create({
        kind: "comment",
        actor_id: currentUserId,
        recipient_id: post.user_id,
        post_id: postId,
        comment_id: cmt._id,
        content: "đã bình luận bài viết của bạn",
        read: false,
      });
    }

    res.status(201).json({ success: true, data: cmt });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Lỗi khi bình luận" });
  }
};

exports.deleteUserComment = async (req, res) => {
  try {
    const cmt = await Comment.findById(req.params.id);
    if (!cmt) return res.status(404).json({ success: false, message: "Bình luận không tồn tại" });
    
    const currentUserId = String(req.user._id || req.user.id);
    if (String(cmt.user_id) !== currentUserId) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xóa" });
    }

    await Comment.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: "Đã xóa bình luận" });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};