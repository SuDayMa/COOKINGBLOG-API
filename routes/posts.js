// routes/posts.js (ESM)
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { Post } from '../models/Post.js';
import { auth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({
  dest: path.join(__dirname, '../uploads'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ============ CREATE POST (ADMIN ONLY) ============
router.post(
  '/',
  auth,           // phải có token hợp lệ
  requireAdmin,   // và role = 'admin'
  upload.single('image'),
  async (req, res) => {
    try {
      const { title, description, ingredients, steps } = req.body || {};
      if (!title) {
        return res.status(400).json({ message: 'Thiếu title' });
      }
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthenticated' });
      }

      const { id: authorId, name: authorName, avatar: authorAvatar } = req.user;

      let imageUrl = '';
      if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
      }

      const doc = await Post.create({
        title,
        description,
        ingredients,
        steps,
        imageUrl,
        author: {
          id: authorId,
          name: authorName,
          avatar: authorAvatar || '',
        },
      });

      res.json({
        id: String(doc._id),
        title: doc.title,
        description: doc.description,
        ingredients: doc.ingredients,
        steps: doc.steps,
        imageUrl: doc.imageUrl,
        author: doc.author,
        createdAt: doc.createdAt,
      });
    } catch (e) {
      console.error('POST /posts error', e);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ============ LIST POSTS (PUBLIC) ============
router.get('/', async (_req, res) => {
  try {
    const items = await Post.find().sort({ createdAt: -1 }).lean();
    res.json(
      items.map((doc) => ({
        id: String(doc._id),
        title: doc.title,
        description: doc.description,
        ingredients: doc.ingredients,
        steps: doc.steps,
        imageUrl: doc.imageUrl,
        author: doc.author,
        createdAt: doc.createdAt,
      }))
    );
  } catch (e) {
    console.error('GET /posts error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ POST DETAIL (PUBLIC) ============
router.get('/:id', async (req, res) => {
  try {
    const doc = await Post.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: 'Not found' });

    res.json({
      id: String(doc._id),
      title: doc.title,
      description: doc.description,
      ingredients: doc.ingredients,
      steps: doc.steps,
      imageUrl: doc.imageUrl,
      author: doc.author,
      createdAt: doc.createdAt,
    });
  } catch (e) {
    console.error('GET /posts/:id error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
