const Report = require("../models/Report"); 
const Post = require("../models/Post");
const mongoose = require("mongoose"); // Thêm để kiểm tra ID hợp lệ

exports.createReport = async (req, res) => {
  try {
    const { postId, reason, description } = req.body;

    // 1. Kiểm tra đầu vào cơ bản
    if (!postId || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: "Vui lòng chọn bài viết và lý do báo cáo" 
      });
    }

    // 2. Kiểm tra xem postId gửi lên có đúng định dạng ObjectId không
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Mã bài viết không hợp lệ" 
      });
    }

    // 3. Tìm bài viết bằng findById
    const post = await Post.findById(postId); 
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: "Bài viết không tồn tại trên hệ thống" 
      });
    }

    // 4. Kiểm tra xem người dùng này đã báo cáo bài này (trạng thái chờ) chưa
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

    // 5. Tạo báo cáo mới - Để Mongoose tự xử lý ép kiểu ObjectId
    const report = await Report.create({
      reporter_id: req.user.id, 
      post_id: postId,         
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