// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

// POST /api/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ success: false, message: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.toLowerCase(), password: hashed });

    const access_token = signToken(user);

    return res.status(201).json({
      success: true,
      data: { user: { id: user.id, name: user.name, email: user.email, access_token } }
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const access_token = signToken(user);

    return res.status(200).json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email },
        access_token
      }
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/me
router.get("/me", auth, async (req, res) => {
  const user = await User.findOne({ id: req.user.id }).select("id name email avatar phone bio");
  if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });
  return res.status(200).json({ success: true, data: { id: user.id, name: user.name, email: user.email } });
});

module.exports = router;
