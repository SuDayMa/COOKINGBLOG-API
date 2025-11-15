// routes/users.js
import express from 'express';
import { User } from '../models/User.js';
import { auth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

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
        avatar: u.avatar || '',
        createdAt: u.createdAt,
      }))
    );
  } catch (e) {
    console.error('GET /users error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /users/:id  (update name/email/role, admin only)
router.patch('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body || {};

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

export default router;
