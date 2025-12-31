const express = require("express");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");
const SavedPost = require("../models/SavedPost");

const router = express.Router();

// ✅ helper chuẩn hoá URL ảnh/avatar
function toFileUrl(req, value) {
  if (!value) return null;

  // nếu đã là URL tuyệt đối
  if (/^https?:\/\//i.test(value)) return value;

  const clean = String(value).replace(/^\/+/, ""); // bỏ / đầu
  const path = clean.startsWith("uploads/") ? clean : `uploads/${clean}`;

  return `${req.protocol}://${req.get("host")}/${path}`;
}

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
      status: "pending", // ✅ nếu model có status (admin duyệt)
    });

    return res.status(201).json({
      success: true,
      data: { id: post.id, title: post.title, user_id: post.user_id, created_at: post.created_at },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ ADMIN: PATCH /api/posts/:id/status
router.patch("/:id/status", auth, adminOnly, async (req, res) => {
  const { status } = req.body || {};
  if (!["pending", "approved", "hidden"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  const post = await Post.findOne({ id: req.params.id });
  if (!post) return res.status(404).json({ success: false, message: "Post not found" });

  post.status = status;
  await post.save();

  return res.status(200).json({
    success: true,
    data: { id: post.id, status: post.status, updated_at: post.updated_at },
  });
});

// ✅ ADMIN: DELETE /api/posts/:id/admin
router.delete("/:id/admin", auth, adminOnly, async (req, res) => {
  const post = await Post.findOne({ id: req.params.id }).select("id");
  if (!post) return res.status(404).json({ success: false, message: "Post not found" });

  await Post.deleteOne({ id: req.params.id });
  return res.status(200).json({ success: true, message: "Deleted successfully" });
});

// GET /api/posts (Public) pagination + search + ✅join user + ✅url images
router.get("/", async (req, res) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 50);
  const q = (req.query.q || "").trim();
  const status = (req.query.status || "").trim(); // optional: pending|approved|hidden

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
  if (status && ["pending", "approved", "hidden"].includes(status)) {
    filter.status = status;
  }

  const total = await Post.countDocuments(filter);

  const posts = await Post.find(filter)
    .sort({ created_at: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const userIds = [...new Set(posts.map((p) => p.user_id))];
  const users = await User.find({ id: { $in: userIds } })
    .select("id name avatar")
    .lean();
  const userMap = new Map(users.map((u) => [u.id, u]));

  const items = posts.map((p) => {
    const u = userMap.get(p.user_id);
    return {
      id: p.id,
      title: p.title,
      image: toFileUrl(req, p.image),
      created_at: p.created_at,
      user_id: p.user_id,
      status: p.status,
      user: u
        ? { id: u.id, name: u.name, avatar: toFileUrl(req, u.avatar) }
        : null,
    };
  });

  return res.status(200).json({ success: true, data: { page, limit, total, items } });
});

// ✅ GET /api/posts/:id/comments (Public)
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

  const data = comments.map((c) => {
    const u = map.get(c.user_id);
    return {
      id: c.id,
      content: c.content,
      user: u ? { id: u.id, name: u.name, avatar: toFileUrl(req, u.avatar) } : null,
      created_at: c.created_at,
    };
  });

  return res.status(200).json({ success: true, data });
});

// ✅ GET /api/posts/:id/saved-count (Public)
router.get("/:id/saved-count", async (req, res) => {
  const post = await Post.findOne({ id: req.params.id }).select("id");
  if (!post) return res.status(404).json({ success: false, message: "Post not found" });

  const count = await SavedPost.countDocuments({ post_id: req.params.id });
  return res.status(200).json({ success: true, data: { postId: req.params.id, count } });
});

// GET /api/posts/:id (Public) detail + ✅avatar+image URL
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
      image: toFileUrl(req, post.image),
      ingredients: post.ingredients,
      steps: post.steps,
      status: post.status,
      user: user ? { id: user.id, name: user.name, avatar: toFileUrl(req, user.avatar) } : null,
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
