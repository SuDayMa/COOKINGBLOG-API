const Comment = require("../../models/Comment"); 
const Post = require("../../models/Post");       
const User = require("../../models/User");       
const Notification = require("../../models/Notification");
const { toPublicUrl } = require("../../utils/imageHelper");

exports.getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.query; 
    if (!postId) return res.status(400).json({ success: false, message: "Thiếu postId" });

    const comments = await Comment.find({ post_id: String(postId) })
      .sort({ created_at: -1 })
      .lean();

    const userIds = [...new Set(comments.map(c => c.user_id).filter(Boolean))];
    const users = await User.find({ id: { $in: userIds } }).select("id name avatar").lean();
    const userMap = new Map(users.map(u => [u.id, u]));

    const data = comments.map(c => {
      const user = userMap.get(c.user_id);
      return {
        ...c,
        id: c.id || c._id.toString(),
        author: user ? {
          id: user.id,
          name: user.name,
          avatar: toPublicUrl(req, user.avatar)
        } : { name: "Người dùng hệ thống", avatar: null }
      };
    });

    res.json({ success: true, data });
  } catch (e) {
    console.error("GET COMMENTS ERROR:", e);
    res.status(500).json({ success: false, message: "Lỗi khi lấy bình luận" });
  }
};

exports.createComment = async (req, res) => {
  try {
    const { postId, content } = req.body;
    if (!postId || !content) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bình luận" });
    }

    const post = await Post.findOne({ id: postId });
    if (!post) return res.status(404).json({ success: false, message: "Bài viết không tồn tại" });

    const currentUserId = String(req.user.id);

    const cmtId = `cmt-${Date.now()}`;
    const cmt = await Comment.create({
      id: cmtId,
      post_id: String(postId),
      user_id: currentUserId, 
      content,
      status: "visible",
    });

    await Post.findOneAndUpdate({ id: postId }, { $inc: { comments: 1 } });

    if (String(post.user_id) !== currentUserId) {
      await Notification.create({
        id: `noti-${Date.now()}`,
        kind: "comment",
        actor_id: currentUserId,
        recipient_id: post.user_id,
        post_id: postId,
        content: "đã bình luận bài viết của bạn",
        read: false,
      });
    }

    res.status(201).json({ success: true, data: cmt });
  } catch (e) {
    console.error("CREATE COMMENT ERROR:", e);
    res.status(500).json({ success: false, message: "Lỗi khi gửi bình luận" });
  }
};

exports.deleteUserComment = async (req, res) => {
  try {
    const { id } = req.params; 
    const currentUserId = String(req.user.id);

    const cmt = await Comment.findOne({ id: id });
    if (!cmt) return res.status(404).json({ success: false, message: "Bình luận không tồn tại" });
    
    if (String(cmt.user_id) !== currentUserId) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xóa bình luận này" });
    }

    await Comment.deleteOne({ id: id });
    await Post.findOneAndUpdate({ id: cmt.post_id }, { $inc: { comments: -1 } });

    res.json({ success: true, message: "Đã xóa bình luận" });
  } catch (e) {
    console.error("DELETE COMMENT ERROR:", e);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi xóa" });
  }
};