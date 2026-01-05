const Post = require("../../models/Post");
const User = require("../../models/User");
const { toPublicUrl } = require("../../utils/imageHelper");

// Lấy danh sách bài viết kèm thông tin tác giả
exports.getAdminPosts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 50);
    const q = (req.query.q || "").trim();
    const status = (req.query.status || "").trim();

    const filter = {};
    if (q) {
      filter.$or = [{ title: new RegExp(q, "i") }, { description: new RegExp(q, "i") }];
    }
    if (["pending", "approved", "hidden"].includes(status)) filter.status = status;

    const total = await Post.countDocuments(filter);
    const rows = await Post.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const userIds = [...new Set(rows.map(r => r.user_id).filter(Boolean))];
    const users = await User.find({ id: { $in: userIds } }).select("id name avatar").lean();
    const userMap = new Map(users.map(u => [u.id, u]));

    const items = rows.map(p => {
      const au = userMap.get(p.user_id);
      return {
        ...p,
        image: toPublicUrl(req, p.image),
        author: au ? { ...au, avatar: toPublicUrl(req, au.avatar) } : null,
      };
    });

    res.status(200).json({ success: true, data: { page, limit, total, items } });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

// Cập nhật trạng thái (Duyệt/Ẩn bài)
exports.updatePostStatus = async (req, res) => {
  const { status } = req.body;
  if (!["pending", "approved", "hidden"].includes(status)) {
    return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
  }
  const post = await Post.findOneAndUpdate({ id: req.params.id }, { status }, { new: true });
  if (!post) return res.status(404).json({ success: false, message: "Không tìm thấy bài" });
  res.json({ success: true, data: { id: post.id, status: post.status } });
};

// Xóa bài viết
exports.deletePost = async (req, res) => {
  const result = await Post.deleteOne({ id: req.params.id });
  if (result.deletedCount === 0) return res.status(404).json({ success: false, message: "Không tìm thấy bài" });
  res.json({ success: true, message: "Đã xóa thành công" });
};