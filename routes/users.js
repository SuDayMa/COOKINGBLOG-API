const express = require("express");
const bcrypt = require("bcryptjs");
const auth = require("../middleware/auth");
const User = require("../models/User");
const Post = require("../models/Post");

const router = express.Router();

// PUT /users/profile (Private)
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, avatar, phone, bio } = req.body || {};
    const update = {};
    if (name !== undefined) update.name = name;
    if (avatar !== undefined) update.avatar = avatar;
    if (phone !== undefined) update.phone = phone;
    if (bio !== undefined) update.bio = bio;

    const user = await User.findOneAndUpdate(
      { id: req.user.id },
      { $set: update },
      { new: true }
    ).select("id name email avatar phone bio created_at updated_at");

    return res.status(200).json({ success: true, data: user });
  } catch (e) {
    return res.status(400).json({ success: false, message: "Invalid data" });
  }
});

// PUT /users/change-password (Private)
router.put("/change-password", auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) return res.status(403).json({ success: false, message: "Old password incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /users/:id (Public)
router.get("/:id", async (req, res) => {
  const user = await User.findOne({ id: req.params.id }).select("id name avatar bio");
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  return res.status(200).json({ success: true, data: user });
});

// GET /users/:id/posts (Public)
router.get("/:id/posts", async (req, res) => {
  const user = await User.findOne({ id: req.params.id }).select("id");
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const items = await Post.find({ user_id: req.params.id })
    .sort({ created_at: -1 })
    .select("id title image created_at");

  return res.status(200).json({ success: true, data: { user_id: req.params.id, items } });
});

module.exports = router;
