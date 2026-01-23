const Report = require("../../models/Report"); 
const Post = require("../../models/Post");     

exports.createReport = async (req, res) => {
  try {
    const { postId, reason, description } = req.body;

    if (!postId || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: "Vui lòng chọn bài viết và lý do báo cáo" 
      });
    }

    const post = await Post.findOne({ id: postId });
    if (!post) {
      return res.status(404).json({ success: false, message: "Bài viết không tồn tại" });
    }

    const existingReport = await Report.findOne({
      reporter_id: req.user.id,
      post_id: postId,
      status: "pending"
    });

    if (existingReport) {
      return res.status(400).json({ 
        success: false, 
        message: "Bạn đã gửi báo cáo cho bài viết này rồi, vui lòng chờ xử lý." 
      });
    }

    const report = await Report.create({
      id: `report-${Date.now()}`, 
      reporter_id: String(req.user.id),
      post_id: String(postId),
      reason,
      description: description || "",
      status: "pending"
    });

    res.status(201).json({
      success: true,
      message: "Báo cáo của bạn đã được gửi. Chúng tôi sẽ xem xét sớm nhất có thể.",
      data: report
    });

  } catch (e) {
    console.error("REPORT ERROR:", e);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi gửi báo cáo" });
  }
};