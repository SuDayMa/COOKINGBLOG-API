// routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const router = express.Router();

// helper để tạo token
function signToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }
  return jwt.sign(
    { sub: String(user._id), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

// ĐĂNG KÝ
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body || {};

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Thiếu name / email / password" });
    }

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return res.status(409).json({ message: "Email đã được sử dụng" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: "user",
      phone: phone || "",
      avatar: "",
    });

    const token = signToken(user);

    res.status(201).json({
      token,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || "",
        avatar: user.avatar || "",
      },
    });
  } catch (e) {
    console.error("register error", e);
    res.status(500).json({ message: "Server error" });
  }
});

// ĐĂNG NHẬP
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email và mật khẩu là bắt buộc" });
    }

    // cần lấy passwordHash => dùng select("+passwordHash") và KHÔNG lean
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      return res.status(401).json({ message: "Sai email hoặc mật khẩu" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Sai email hoặc mật khẩu" });
    }

    const token = signToken(user);

    res.json({
      token,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || "",
        avatar: user.avatar || "",
      },
    });
  } catch (e) {
    console.error("login error", e);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
