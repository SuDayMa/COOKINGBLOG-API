const SavedPost = require("../models/SavedPost");
const Post = require("../models/Post");
const { toPublicUrl } = require("../utils/imageHelper");

exports.toggleSave = async (req, res) => {
  try {
    const { postId } = req.body;
    if (!postId) return res.status(400).json({ success: false, message: "Thiếu postId" });

    const post = await Post.findOne({ id: postId }).select("id");
    if (!post) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });

    const exists = await SavedPost.findOne({ user_id: req.user.id, post_id: postId });

    if (exists) {
      await SavedPost.deleteOne({ id: exists.id });
      return res.json({ success: true, data: { postId, saved: false } });
    }

    await SavedPost.create({ user_id: req.user.id, post_id: postId });
    res.json({ success: true, data: { postId, saved: true } });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

exports.getSavedPosts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1"), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "10"), 1), 50);

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
      .map(s => {
        const p = map.get(s.post_id);
        if (!p) return null;
        return {
          ...p,
          image: toPublicUrl(req, p.image) 
        };
      })
      .filter(Boolean);

    res.json({ success: true, data: { page, limit, total, items } });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

exports.checkSaved = async (req, res) => {
  const exists = await SavedPost.findOne({ user_id: req.user.id, post_id: req.params.postId });
  res.json({ success: true, data: { postId: req.params.postId, saved: !!exists } });
};