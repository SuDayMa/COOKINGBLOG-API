const Report = require("../models/Report"); 
const Post = require("../models/Post");
const Comment = require("../models/Comment"); 
const mongoose = require("mongoose");

exports.createReport = async (req, res) => {
  try {
    const { postId, commentId, reason, description } = req.body;
    const userId = req.user.id;

    // LOG để kiểm tra dữ liệu từ App gửi lên
    console.log("📩 Nhận yêu cầu báo cáo:", { postId, commentId, reason });

    // 1. Kiểm tra đầu vào
    if (!postId || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: "Vui lòng chọn nội dung và lý do báo cáo" 
      });
    }

    // 2. Tìm bài viết
    const post = await Post.findById(postId); 
    if (!post) {
      console.log("❌ Lỗi: Không tìm thấy Post ID", postId);
      return res.status(404).json({ 
        success: false, 
        message: "Bài viết không tồn tại trên hệ thống" 
      });
    }

    // 2.1 Nếu tố cáo comment, kiểm tra comment
    if (commentId) {
      const comment = await Comment.findById(commentId);
      if (!comment) {
        console.log("❌ Lỗi: Không tìm thấy Comment ID", commentId);
        return res.status(404).json({ 
          success: false, 
          message: "Bình luận không tồn tại hoặc đã bị xóa" 
        });
      }
    }

    // 3. Kiểm tra báo cáo trùng (Đã sửa lại logic Query chuẩn hơn)
    const duplicateQuery = {
      reporter_id: userId,
      post_id: postId,
      status: "pending"
    };
    
    if (commentId) {
      duplicateQuery.comment_id = commentId;
    } else {
      // Sửa ở đây: Kiểm tra comment_id là null hoặc không tồn tại
      duplicateQuery.comment_id = { $in: [null, undefined] };
    }

    const existingReport = await Report.findOne(duplicateQuery);

    if (existingReport) {
      console.log("⚠️ Báo cáo đã tồn tại trước đó");
      return res.status(400).json({ 
        success: false, 
        message: commentId 
          ? "Bạn đã gửi báo cáo cho bình luận này rồi." 
          : "Bạn đã gửi báo cáo cho bài viết này rồi, vui lòng chờ xử lý." 
      });
    }

    // 4. Tạo báo cáo mới 
    const reportData = {
      // Tạo một mã string ngẫu nhiên nếu Model yêu cầu trường id dạng String
      id: `rep-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      reporter_id: userId, 
      post_id: postId,          
      reason: reason,
      description: description || "",
      status: "pending",
      comment_id: commentId || null // Luôn gán null nếu không có để dễ query
    };

    const report = await Report.create(reportData);
    console.log("✅ Lưu báo cáo thành công:", report._id);

    return res.status(201).json({
      success: true,
      message: "Báo cáo của bạn đã được gửi thành công.",
      data: report
    });

  } catch (e) {
    console.error("🔥 [REPORT CONTROLLER ERROR]:", e.message);
    
    return res.status(500).json({ 
      success: false, 
      message: "Lỗi hệ thống khi gửi báo cáo: " + e.message,
    });
  }
};