const Report = require("../models/Report"); 
const Post = require("../models/Post");
const mongoose = require("mongoose");

exports.createReport = async (req, res) => {
  try {
    const { postId, reason, description } = req.body;

    // 1. Kiểm tra đầu vào
    if (!postId || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: "Vui lòng chọn bài viết và lý do báo cáo" 
      });
    }

    // 2. Tìm bài viết 
    const post = await Post.findById(postId); 
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: "Bài viết không tồn tại trên hệ thống" 
      });
    }

    // 3. Kiểm tra báo cáo trùng 
    const existingReport = await Report.findOne({
      reporter_id: String(req.user.id),
      post_id: String(postId),
      status: "pending"
    });

    if (existingReport) {
      return res.status(400).json({ 
        success: false, 
        message: "Bạn đã gửi báo cáo cho bài viết này rồi, vui lòng chờ xử lý." 
      });
    }

    // 4. Tạo báo cáo mới 
    const report = await Report.create({
      id: `rep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Tạo mã ID duy nhất
      reporter_id: String(req.user.id), 
      post_id: String(postId),          
      reason: reason,
      description: description || "",
      status: "pending"
    });

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