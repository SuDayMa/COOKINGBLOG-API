const Report = require("../models/Report");
const Post = require("../models/Post");

exports.createReport = async (req, res) => {
  try {
    const { postId, reason, description } = req.body;

    if (!postId || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: "Thiếu postId hoặc lý do báo cáo" 
      });
    }

    const post = await Post.findOne({ id: postId });
    if (!post) {
      return res.status(404).json({ success: false, message: "Bài viết không tồn tại" });
    }

    const report = await Report.create({
      reporter_id: req.user.id,
      post_id: postId,
      reason,
      description: description || null,
      status: "pending"
    });

    res.status(201).json({
      success: true,
      message: "Báo cáo của bạn đã được gửi tới quản trị viên",
      data: report
    });
  } catch (e) {
    console.error("REPORT ERROR:", e);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi gửi báo cáo" });
  }
};