const Post = require("../models/Post");
const User = require("../models/User");

// Hàm Helper (Để trong Controller hoặc Utils đều được)
const formatImageUrl = (req, imagePath) => {
  if (!imagePath) return null;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  const cleanPath = String(imagePath).replace(/^\/+/, "");
  const finalPath = cleanPath.startsWith("uploads/") ? cleanPath : `uploads/${cleanPath}`;
  return `${req.protocol}://${req.get("host")}/${finalPath}`;
};

// --- LOGIC LẤY DANH SÁCH ---
exports.getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, q = "", status = "approved" } = req.query;
    const filter = { status };
    if (q) {
      filter.$or = [{ title: new RegExp(q, "i") }, { description: new RegExp(q, "i") }];
    }

    const posts = await Post.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const items = await Promise.all(posts.map(async (p) => {
      const u = await User.findOne({ id: p.user_id }).select("name avatar").lean();
      return {
        ...p,
        image: formatImageUrl(req, p.image),
        user: u ? { ...u, avatar: formatImageUrl(req, u.avatar) } : null
      };
    }));

    res.json({ success: true, data: { items } });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

// --- LOGIC TẠO BÀI VIẾT ---
exports.createPost = async (req, res) => {
  try {
    const { title, description, image, ingredients, steps } = req.body;
    const post = await Post.create({
      user_id: req.user.id,
      title,
      description,
      image,
      ingredients,
      steps,
      status: "pending"
    });
    res.status(201).json({ success: true, data: post });
  } catch (e) {
    res.status(400).json({ success: false, message: "Không thể tạo bài viết" });
  }
};