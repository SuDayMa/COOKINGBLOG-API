const express = require("express");
const auth = require("../middleware/auth");
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const User = require("../models/User");
const Notification = require("../models/Notification");

const router = express.Router();

// POST /comments (Private)
router.post("/", auth, async (req, res) => {
  const { postId, content } = req.body || {};
  if (!postId || !content) return res.status(400).json({ success: false, message: "postId/content required" });

  const post = await Post.findOne({ id: postId });
  if (!post) return res.status(404).json({ success: false, message: "Post not found" });

  const cmt = await Comment.create({
    post_id: postId,
    user_id: req.user.id,
    content
  });

  // tạo notification cho chủ post (trừ khi tự comment bài mình)
  if (post.user_id !== req.user.id) {
    await Notification.create({
      kind: "comment",
      actor_id: req.user.id,
      recipient_id: post.user_id,
      post_id: postId,
      comment_id: cmt.id,
      content: "đã bình luận bài viết của bạn"
    });
  }

  return res.status(200).json({
    success: true,
    data: { id: cmt.id, post_id: cmt.post_id, user_id: cmt.user_id, content: cmt.content }
  });
});

// DELETE /comments/:id (Private)
router.delete("/:id", auth, async (req, res) => {
  const cmt = await Comment.findOne({ id: req.params.id });
  if (!cmt) return res.status(404).json({ success: false, message: "Comment not found" });
  if (cmt.user_id !== req.user.id) return res.status(403).json({ success: false, message: "Forbidden" });

  await Comment.deleteOne({ id: req.params.id });
  return res.status(200).json({ success: true, message: "Deleted successfully" });
});

// GET /posts/:id/comments (Public)  -> đặt ở comments route cho đúng contract
router.get("/post/:postId", async (req, res) => {
  const post = await Post.findOne({ id: req.params.postId }).select("id");
  if (!post) return res.status(404).json({ success: false, message: "Post not found" });

  const comments = await Comment.find({ post_id: req.params.postId })
    .sort({ created_at: -1 })
    .lean();

  // join user
  const userIds = [...new Set(comments.map(c => c.user_id))];
  const users = await User.find({ id: { $in: userIds } }).select("id name avatar").lean();
  const map = new Map(users.map(u => [u.id, u]));

  const data = comments.map(c => ({
    id: c.id,
    content: c.content,
    user: map.get(c.user_id) ? { id: map.get(c.user_id).id, name: map.get(c.user_id).name } : null,
    created_at: c.created_at
  }));

  return res.status(200).json({ success: true, data });
});

module.exports = router;
