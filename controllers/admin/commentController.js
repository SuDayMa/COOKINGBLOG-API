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

    const [total, rows] = await Promise.all([
      Comment.countDocuments(filter),
      Comment.find(filter)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
    ]);

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
        id: c.id || c._id.toString(),
        user: u ? { ...u, avatar: toPublicUrl(req, u.avatar) } : { name: "N/A", avatar: null },
        post: p ? { ...p, image: toPublicUrl(req, p.image) } : { title: "Bài viết đã bị xóa", image: null },
      };
    });

    res.status(200).json({ success: true, data: { page, limit, total, items } });
  } catch (e) {
    console.error("ADMIN GET COMMENTS ERROR:", e);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi lấy danh sách bình luận" });
  }
};

exports.toggleCommentHidden = async (req, res) => {
  try {
    const { id } = req.params;
    const c = await Comment.findOne({ id });
    if (!c) return res.status(404).json({ success: false, message: "Không tìm thấy bình luận" });
    
    const newStatus = c.status === "hidden" ? "visible" : "hidden";
    
    const updatedCmt = await Comment.findOneAndUpdate(
      { id },
      { $set: { status: newStatus } },
      { new: true }
    );

    res.json({ 
      success: true, 
      message: `Đã chuyển trạng thái sang ${newStatus}`,
      data: { id: updatedCmt.id, status: updatedCmt.status } 
    });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi khi cập nhật trạng thái bình luận" });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const cmt = await Comment.findOne({ id });
    if (!cmt) return res.status(404).json({ success: false, message: "Không tìm thấy bình luận" });

    await Promise.all([
      Comment.deleteOne({ id }),
      Post.findOneAndUpdate({ id: cmt.post_id }, { $inc: { comments: -1 } })
    ]);

    res.json({ success: true, message: "Đã xóa bình luận vĩnh viễn" });
  } catch (e) {
    console.error("ADMIN DELETE COMMENT ERROR:", e);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi xóa bình luận" });
  }
};