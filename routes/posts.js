const express = require("express");
const auth = require("../middleware/auth");
const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");
const SavedPost = require("../models/SavedPost");

const router = express.Router();

// POST /api/posts (Private)
router.post("/", auth, async (req, res) => {
  try {
    const { title, description, image, ingredients, steps } = req.body || {};
    if (!title || !description) {
      return res.status(400).json({ success: false, message: "title/description required" });
    }

    const post = await Post.create({
      user_id: req.user.id,
      title,
      description,
      image: image ?? null,
      ingredients: ingredients ?? null,
      steps: steps ?? null,
    });

    return res.status(201).json({
      success: true,
      data: { id: post.id, title: post.title, user_id: post.user_id, created_at: post.created_at },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/posts (Public) pagination + search
router.get("/", async (req, res) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 50);
  const q = (req.query.q || "").trim();

  if (Number.isNaN(page) || Number.isNaN(limit)) {
    return res.status(400).json({ success: false, message: "Invalid page/limit" });
  }

  const filter = {};
  if (q) {
    filter.$or = [
      { title: new RegExp(q, "i") },
      { description: new RegExp(q, "i") },
    ];
  }

  const total = await Post.countDocuments(filter);
  const items = await Post.find(filter)
    .sort({ created_at: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .select("id title image created_at user_id");

  return res.status(200).json({ success: true, data: { page, limit, total, items } });
});

// ✅ GET /api/posts/:id/comments (Public) - phải đặt TRƯỚC /:id
router.get("/:id/comments", async (req, res) => {
  const post = await Post.findOne({ id: req.params.id }).select("id");
  if (!post) return res.status(404).json({ success: false, message: "Post not found" });

  const comments = await Comment.find({ post_id: req.params.id })
    .sort({ created_at: -1 })
    .lean();

  const userIds = [...new Set(comments.map((c) => c.user_id))];
  const users = await User.find({ id: { $in: userIds } })
    .select("id name avatar")
    .lean();
  const map = new Map(users.map((u) => [u.id, u]));

  const data = comments.map((c) => ({
    id: c.id,
    content: c.content,
    user: map.get(c.user_id)
      ? { id: map.get(c.user_id).id, name: map.get(c.user_id).name }
      : null,
    created_at: c.created_at,
  }));

  return res.status(200).json({ success: true, data });
});

// ✅ GET /api/posts/:id/saved-count (Public) - đặt TRƯỚC /:id
router.get("/:id/saved-count", async (req, res) => {
  const post = await Post.findOne({ id: req.params.id }).select("id");
  if (!post) return res.status(404).json({ success: false, message: "Post not found" });

  const count = await SavedPost.countDocuments({ post_id: req.params.id });
  return res.status(200).json({ success: true, data: { postId: req.params.id, count } });
});

// GET /api/posts/:id (Public) - detail + user info
router.get("/:id", async (req, res) => {
  const post = await Post.findOne({ id: req.params.id }).lean();
  if (!post) return res.status(404).json({ success: false, message: "Post not found" });

  const user = await User.findOne({ id: post.user_id }).select("id name avatar").lean();

  return res.status(200).json({
    success: true,
    data: {
      id: post.id,
      title: post.title,
      description: post.description,
      image: post.image,
      ingredients: post.ingredients,
      steps: post.steps,
      user: user ? { id: user.id, name: user.name, avatar: user.avatar } : null,
      created_at: post.created_at,
    },
  });
});

// PUT /api/posts/:id (Private)
router.put("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findOne({ id: req.params.id });
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    if (post.user_id !== req.user.id) return res.status(403).json({ success: false, message: "Forbidden" });

    const { title, description, image, ingredients, steps } = req.body || {};
    if (title !== undefined) post.title = title;
    if (description !== undefined) post.description = description;
    if (image !== undefined) post.image = image;
    if (ingredients !== undefined) post.ingredients = ingredients;
    if (steps !== undefined) post.steps = steps;

    await post.save();

    return res.status(200).json({
      success: true,
      data: { id: post.id, title: post.title, updated_at: post.updated_at },
    });
  } catch (e) {
    return res.status(400).json({ success: false, message: "Invalid data" });
  }
});

// DELETE /api/posts/:id (Private)
router.delete("/:id", auth, async (req, res) => {
  const post = await Post.findOne({ id: req.params.id });
  if (!post) return res.status(404).json({ success: false, message: "Post not found" });
  if (post.user_id !== req.user.id) return res.status(403).json({ success: false, message: "Forbidden" });

  await Post.deleteOne({ id: req.params.id });
  return res.status(200).json({ success: true, message: "Deleted successfully" });
});

module.exports = router;
