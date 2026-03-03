const Comment = require("../models/Comment"); 
const Post = require("../models/Post");       
const User = require("../models/User");       
const Notification = require("../models/Notification");
const { toPublicUrl } = require("../utils/imageHelper");
const mongoose = require("mongoose");

exports.getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.query;
    if (!postId) return res.status(400).json({ success: false, message: "Thiếu postId" });

    const comments = await Comment.find({ post_id: String(postId) })
      .sort({ created_at: -1 })
      .lean();

    const userIds = [...new Set(comments.map(c => c.user_id).filter(Boolean))];
    const users = await User.find({ 
      $or: [{ _id: { $in: userIds } }, { id: { $in: userIds } }] 
    }).select("id _id name avatar").lean();

    const userMap = new Map();
    users.forEach(u => {
      userMap.set(String(u._id), u);
      if(u.id) userMap.set(String(u.id), u);
    });

    const data = comments.map(c => {
      const user = userMap.get(String(c.user_id));
      return {
        ...c,
        id: c._id.toString(),
        user_id: {
          id: user?._id || user?.id || c.user_id,
          name: user?.name || "Người dùng Daily Cook",
          avatar: user?.avatar ? toPublicUrl(req, user.avatar) : null
        }
      };
    });

    res.json({ success: true, data });
  } catch (e) {
    console.error("GET COMMENTS ERROR:", e);
    res.status(500).json({ success: false, message: "Lỗi khi lấy bình luận" });
  }
};

// 2. Tạo bình luận 
exports.createComment = async (req, res) => {
  try {
    const { postId, content } = req.body;
    const currentUserId = String(req.user.id);

    if (!postId || !content) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bình luận" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Bài viết không tồn tại" });
    }

    const cmtId = `cmt-${Date.now()}`;
    const cmt = await Comment.create({
      id: cmtId,
      post_id: String(post._id), // Đồng bộ với _id bài viết
      user_id: currentUserId, 
      content: content.trim(),
      status: "visible",
    });

    await Post.findByIdAndUpdate(post._id, { $inc: { comments: 1 } });

    const postAuthorId = post.author?._id || post.author || post.user_id;
    if (String(postAuthorId) !== currentUserId) {
      await Notification.create({
        id: `noti-${Date.now()}`,
        kind: "comment",
        actor_id: currentUserId,
        recipient_id: postAuthorId,
        post_id: postId,
        content: "đã bình luận bài viết của bạn",
        read: false,
      });
    }

    res.status(201).json({ success: true, data: cmt });
  } catch (e) {
    console.error("CREATE COMMENT ERROR:", e);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi gửi bình luận" });
  }
};

// 3. Xóa bình luận (Fix lỗi tìm kiếm ID)
exports.deleteUserComment = async (req, res) => {
  try {
    const { id } = req.params; 
    const currentUserId = String(req.user.id);

    const cmt = await Comment.findById(id);
    if (!cmt) return res.status(404).json({ success: false, message: "Bình luận không tồn tại" });
    
    if (String(cmt.user_id) !== currentUserId) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xóa" });
    }

    await Comment.findByIdAndDelete(id);
    await Post.findByIdAndUpdate(cmt.post_id, { $inc: { comments: -1 } });

    res.json({ success: true, message: "Đã xóa bình luận" });
  } catch (e) {
    console.error("DELETE COMMENT ERROR:", e);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi xóa" });
  }
};

// 4. Sửa bình luận 
exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params; // ID của comment cần sửa
    const { content } = req.body; // Nội dung mới
    const currentUserId = String(req.user.id);

    if (!content) {
      return res.status(400).json({ success: false, message: "Nội dung không được để trống" });
    }

    // 1. Tìm bình luận
    const cmt = await Comment.findById(id);
    if (!cmt) {
      return res.status(404).json({ success: false, message: "Bình luận không tồn tại" });
    }

    // 2. Kiểm tra quyền (Chỉ chủ comment mới được sửa)
    if (String(cmt.user_id) !== currentUserId) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền chỉnh sửa bình luận này" });
    }

    // 3. Cập nhật
    cmt.content = content.trim();
    // Nếu bạn có dùng trường updated_at thì cập nhật luôn
    if (cmt.updated_at) cmt.updated_at = Date.now(); 
    
    await cmt.save();

    res.json({ 
      success: true, 
      message: "Cập nhật bình luận thành công", 
      data: cmt 
    });
  } catch (e) {
    console.error("UPDATE COMMENT ERROR:", e);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi cập nhật bình luận" });
  }
};