const Comment = require("../../models/Comment");
const User = require("../../models/User");
const Post = require("../../models/Post");
const { toPublicUrl } = require("../../utils/imageHelper");

exports.getAdminComments = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 50);
    const q = (req.query.q || "").trim();
    const status = (req.query.status || "").trim();

    const filter = {};
    if (q) filter.content = new RegExp(q, "i");
    if (["visible", "hidden"].includes(status)) filter.status = status;

    const total = await Comment.countDocuments(filter);
    const rows = await Comment.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const userIds = [...new Set(rows.map(r => r.user_id).filter(Boolean))];
    const postIds = [...new Set(rows.map(r => r.post_id).filter(Boolean))];

    const [users, posts] = await Promise.all([
      User.find({ id: { $in: userIds } }).select("id name avatar").lean(),
      Post.find({ id: { $in: postIds } }).select("id title image").lean()
    ]);

    const userMap = new Map(users.map(u => [u.id, u]));
    const postMap = new Map(posts.map(p => [p.id, p]));

    const items = rows.map(c => {
      const u = userMap.get(c.user_id);
      const p = postMap.get(c.post_id);
      return {
        ...c,
        user: u ? { ...u, avatar: toPublicUrl(req, u.avatar) } : null,
        post: p ? { ...p, image: toPublicUrl(req, p.image) } : null,
      };
    });

    res.status(200).json({ success: true, data: { page, limit, total, items } });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi lấy danh sách bình luận" });
  }
};

// Ẩn/Hiện bình luận
exports.toggleCommentHidden = async (req, res) => {
  const c = await Comment.findOne({ id: req.params.id });
  if (!c) return res.status(404).json({ success: false, message: "Không tìm thấy bình luận" });
  
  c.status = c.status === "hidden" ? "visible" : "hidden";
  await c.save();
  res.json({ success: true, data: { id: c.id, status: c.status } });
};

// Xóa bình luận
exports.deleteComment = async (req, res) => {
  const result = await Comment.deleteOne({ id: req.params.id });
  if (result.deletedCount === 0) return res.status(404).json({ success: false, message: "Không tìm thấy bình luận" });
  res.json({ success: true, message: "Đã xóa bình luận" });
};