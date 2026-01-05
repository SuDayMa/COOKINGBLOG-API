const Comment = require("../models/Comment");
const Post = require("../models/Post");
const Notification = require("../models/Notification");

exports.createComment = async (req, res) => {
  try {
    const { postId, content } = req.body;
    if (!postId || !content) {
      return res.status(400).json({ success: false, message: "Thiếu postId hoặc nội dung" });
    }

    const post = await Post.findOne({ id: postId });
    if (!post) return res.status(404).json({ success: false, message: "Bài viết không tồn tại" });

    const cmt = await Comment.create({
      post_id: postId,
      user_id: req.user.id,
      content,
      status: "visible",
    });

    // Tạo thông báo cho chủ bài viết (nếu người cmt không phải chủ bài)
    if (post.user_id !== req.user.id) {
      await Notification.create({
        kind: "comment",
        actor_id: req.user.id,
        recipient_id: post.user_id,
        post_id: postId,
        comment_id: cmt.id,
        content: "đã bình luận bài viết của bạn",
        read: false,
      });
    }

    res.status(201).json({ success: true, data: cmt });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi khi bình luận" });
  }
};

exports.deleteUserComment = async (req, res) => {
  try {
    const cmt = await Comment.findOne({ id: req.params.id });
    if (!cmt) return res.status(404).json({ success: false, message: "Bình luận không tồn tại" });
    
    if (cmt.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xóa" });
    }

    await Comment.deleteOne({ id: req.params.id });
    res.json({ success: true, message: "Đã xóa bình luận" });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};