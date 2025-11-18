// routes/users.js
import express from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { auth, requireAdmin } from '../middleware/auth.js';
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/" });
/**
 * === ADMIN: QUẢN LÝ TẤT CẢ USER ===
 */

// GET /users  (admin only)
router.get('/', auth, requireAdmin, async (_req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    res.json(
      users.map((u) => ({
        id: String(u._id),
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone || '',
        avatar: u.avatar || '',
        createdAt: u.createdAt,
      }))
    );
  } catch (e) {
    console.error('GET /users error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /users/:id  (update name/email/role/phone, admin only)
router.patch('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, phone } = req.body || {};

    // Không cho tự hạ quyền admin của chính mình
    if (String(req.user.id) === String(id) && role && role !== 'admin') {
      return res
        .status(400)
        .json({ message: 'Không thể đổi role của chính mình khỏi admin.' });
    }

    const update = {};
    if (typeof name === 'string' && name.trim()) update.name = name.trim();
    if (typeof email === 'string' && email.trim()) update.email = email.trim();
    if (role === 'admin' || role === 'user') update.role = role;
    if (typeof phone === 'string') update.phone = phone.trim();

    const user = await User.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      avatar: user.avatar || '',
      createdAt: user.createdAt,
    });
  } catch (e) {
    console.error('PATCH /users/:id error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /users/:id  (admin only)
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Không cho tự xoá chính mình
    if (String(req.user.id) === String(id)) {
      return res
        .status(400)
        .json({ message: 'Không thể tự xoá tài khoản của chính mình.' });
    }

    const user = await User.findByIdAndDelete(id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ success: true });
  } catch (e) {
    console.error('DELETE /users/:id error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * === USER TỰ QUẢN LÝ TÀI KHOẢN CỦA MÌNH (APP MOBILE) ===
 */

// GET /users/me  (lấy thông tin user hiện tại)
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      avatar: user.avatar || '',
      createdAt: user.createdAt,
    });
  } catch (e) {
    console.error('GET /users/me error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /users/me  (update name/email/phone cho chính mình)
router.put('/me', auth, async (req, res) => {
  try {
    const { name, email, phone, currentPassword } = req.body || {};

    // Lấy user + passwordHash để check mật khẩu
    const user = await User.findById(req.user.id).select('+passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const emailChanged = typeof email === 'string' && email !== user.email;
    const phoneChanged = typeof phone === 'string' && phone !== user.phone;

    // Nếu đổi email hoặc phone thì bắt buộc nhập mật khẩu hiện tại
    if (emailChanged || phoneChanged) {
      if (!currentPassword) {
        return res.status(400).json({
          message: 'Cần mật khẩu hiện tại để đổi email / số điện thoại',
        });
      }
      const ok = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!ok) {
        return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
      }
    }

    if (typeof name === 'string' && name.trim()) {
      user.name = name.trim();
    }
    if (typeof email === 'string' && email.trim()) {
      user.email = email.trim();
    }
    if (typeof phone === 'string') {
      user.phone = phone.trim();
    }

    await user.save();

    res.json({
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      avatar: user.avatar || '',
      createdAt: user.createdAt,
    });
  } catch (e) {
    console.error('PUT /users/me error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /users/me/change-password
router.post('/me/change-password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: 'Thiếu oldPassword / newPassword' });
    }

    const user = await User.findById(req.user.id).select('+passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const ok = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!ok) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (e) {
    console.error('POST /users/me/change-password error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

//P PUT /users/me/avatar  (upload avatar cho chính mình)
router.put("/avatar", auth, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: `/uploads/${req.file.filename}` },
      { new: true }
    ).lean();

    res.json({
      id: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      avatar: user.avatar || "",
      role: user.role,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});