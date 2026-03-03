const Report = require("../models/Report"); 
const Post = require("../models/Post");
const Comment = require("../models/Comment"); // 🔥 Thêm Model Comment để kiểm tra
const mongoose = require("mongoose");

exports.createReport = async (req, res) => {
  try {
    // 🔥 Thêm commentId từ body gửi lên
    const { postId, commentId, reason, description } = req.body;

    // 1. Kiểm tra đầu vào (Cần postId và lý do)
    if (!postId || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: "Vui lòng chọn nội dung và lý do báo cáo" 
      });
    }

    // 2. Tìm bài viết (Luôn cần bài viết gốc)
    const post = await Post.findById(postId); 
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: "Bài viết không tồn tại trên hệ thống" 
      });
    }

    // 🔥 2.1 Nếu là tố cáo bình luận, kiểm tra xem bình luận đó có thật không
    if (commentId) {
      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({ 
          success: false, 
          message: "Bình luận không tồn tại hoặc đã bị xóa" 
        });
      }
    }

    // 3. Kiểm tra báo cáo trùng (Đã cập nhật logic cho cả post và comment)
    const duplicateQuery = {
      reporter_id: String(req.user.id),
      post_id: String(postId),
      status: "pending"
    };
    
    // Nếu có commentId thì phải check xem đã tố cáo chính cái comment đó chưa
    if (commentId) {
      duplicateQuery.comment_id = String(commentId);
    } else {
      // Nếu không có commentId, check xem đã tố cáo cái bài post đó chưa (tránh spam)
      duplicateQuery.comment_id = { $exists: false }; 
    }

    const existingReport = await Report.findOne(duplicateQuery);

    if (existingReport) {
      return res.status(400).json({ 
        success: false, 
        message: commentId 
          ? "Bạn đã gửi báo cáo cho bình luận này rồi." 
          : "Bạn đã gửi báo cáo cho bài viết này rồi, vui lòng chờ xử lý." 
      });
    }

    // 4. Tạo báo cáo mới 
    const reportData = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      reporter_id: String(req.user.id), 
      post_id: String(postId),          
      reason: reason,
      description: description || "",
      status: "pending"
    };

    // 🔥 Nếu có commentId thì gán vào dữ liệu lưu trữ
    if (commentId) {
      reportData.comment_id = String(commentId);
    }

    const report = await Report.create(reportData);

    return res.status(201).json({
      success: true,
      message: "Báo cáo của bạn đã được gửi. Chúng tôi sẽ xem xét sớm nhất có thể.",
      data: report
    });

  } catch (e) {
    console.error("🔥 [REPORT CONTROLLER ERROR]:", e.message);
    
    return res.status(500).json({ 
      success: false, 
      message: "Lỗi hệ thống khi gửi báo cáo",
      error: e.message 
    });
  }
};