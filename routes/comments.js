const express = require("express");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const Notification = require("../models/Notification"); // ✅ thêm

const router = express.Router();

/**
 * ===== ADMIN APIs =====
 * GET    /api/comments?page=&limit=&q=&status=
 * PATCH  /api/comments/:id/toggle-hidden
 * DELETE /api/comments/:id/admin
 */
router.get("/", auth, adminOnly, async (req, res) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 50);
  const q = (req.query.q || "").trim();
  const status = req.query.status; // visible|hidden|undefined

  if (Number.isNaN(page) || Number.isNaN(limit)) {
    return res.status(400).json({ success: false, message: "Invalid page/limit" });
  }

  const filter = {};
  if (q) filter.content = new RegExp(q, "i");
  if (status === "visible") filter.status = "visible";
  if (status === "hidden") filter.status = "hidden";

  const total = await Comment.countDocuments(filter);
  const items = await Comment.find(filter)
    .sort({ created_at: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .select("id post_id user_id content status created_at");

  return res.status(200).json({ success: true, data: { page, limit, total, items } });
});

router.patch("/:id/toggle-hidden", auth, adminOnly, async (req, res) => {
  const c = await Comment.findOne({ id: req.params.id });
  if (!c) return res.status(404).json({ success: false, message: "Comment not found" });

  c.status = c.status === "hidden" ? "visible" : "hidden";
  await c.save();

  return res.status(200).json({ success: true, data: { id: c.id, status: c.status } });
});

router.delete("/:id/admin", auth, adminOnly, async (req, res) => {
  const c = await Comment.findOne({ id: req.params.id }).select("id");
  if (!c) return res.status(404).json({ success: false, message: "Comment not found" });

  await Comment.deleteOne({ id: req.params.id });
  return res.status(200).json({ success: true, message: "Deleted successfully" });
});

/**
 * ===== USER CONTRACTS =====
 * POST   /api/comments
 * DELETE /api/comments/:id
 */
router.post("/", auth, async (req, res) => {
  const { postId, content } = req.body || {};
  if (!postId || !content) {
    return res.status(400).json({ success: false, message: "postId/content required" });
  }

  const post = await Post.findOne({ id: postId });
  if (!post) return res.status(404).json({ success: false, message: "Post not found" });

  const cmt = await Comment.create({
    post_id: postId,
    user_id: req.user.id,
    content,
    status: "visible",
  });

  // notification cho chủ post 
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

  return res.status(200).json({
    success: true,
    data: { id: cmt.id, post_id: cmt.post_id, user_id: cmt.user_id, content: cmt.content },
  });
});

router.delete("/:id", auth, async (req, res) => {
  const cmt = await Comment.findOne({ id: req.params.id });
  if (!cmt) return res.status(404).json({ success: false, message: "Comment not found" });
  if (cmt.user_id !== req.user.id) return res.status(403).json({ success: false, message: "Forbidden" });

  await Comment.deleteOne({ id: req.params.id });
  return res.status(200).json({ success: true, message: "Deleted successfully" });
});

module.exports = router;
