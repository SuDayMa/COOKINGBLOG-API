const express = require("express");
const auth = require("../middleware/auth");
const SavedPost = require("../models/SavedPost");
const Post = require("../models/Post");

const router = express.Router();

// POST /saved/toggle (Private)
router.post("/toggle", auth, async (req, res) => {
  const { postId } = req.body || {};
  if (!postId) return res.status(400).json({ success: false, message: "postId required" });

  const post = await Post.findOne({ id: postId }).select("id");
  if (!post) return res.status(404).json({ success: false, message: "Post not found" });

  const exists = await SavedPost.findOne({ user_id: req.user.id, post_id: postId });

  if (exists) {
    await SavedPost.deleteOne({ id: exists.id });
    return res.status(200).json({ success: true, data: { postId, saved: false } });
  }

  await SavedPost.create({ user_id: req.user.id, post_id: postId });
  return res.status(200).json({ success: true, data: { postId, saved: true } });
});

// GET /saved?page=1&limit=10 (Private)
router.get("/", auth, async (req, res) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 50);

  if (Number.isNaN(page) || Number.isNaN(limit)) {
    return res.status(400).json({ success: false, message: "Invalid page/limit" });
  }

  const total = await SavedPost.countDocuments({ user_id: req.user.id });
  const saved = await SavedPost.find({ user_id: req.user.id })
    .sort({ saved_at: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const postIds = saved.map(s => s.post_id);
  const posts = await Post.find({ id: { $in: postIds } }).select("id title image").lean();
  const map = new Map(posts.map(p => [p.id, p]));

  const items = saved
    .map(s => map.get(s.post_id))
    .filter(Boolean);

  return res.status(200).json({ success: true, data: { page, limit, total, items } });
});

// GET /saved/check/:postId (Private)
router.get("/check/:postId", auth, async (req, res) => {
  const post = await Post.findOne({ id: req.params.postId }).select("id");
  if (!post) return res.status(404).json({ success: false, message: "Post not found" });

  const exists = await SavedPost.findOne({ user_id: req.user.id, post_id: req.params.postId });
  return res.status(200).json({ success: true, data: { postId: req.params.postId, saved: !!exists } });
});

// DELETE /saved/:postId (Private)
router.delete("/:postId", auth, async (req, res) => {
  const del = await SavedPost.deleteOne({ user_id: req.user.id, post_id: req.params.postId });
  if (del.deletedCount === 0) return res.status(404).json({ success: false, message: "Saved record not found" });

  return res.status(200).json({ success: true, message: "Unsaved successfully" });
});

module.exports = router;
