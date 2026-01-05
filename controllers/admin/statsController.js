const User = require("../../models/User");
const Post = require("../../models/Post");
const Comment = require("../../models/Comment");

exports.getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalPosts, pendingPosts, totalComments] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Post.countDocuments({ status: "pending" }),
      Comment.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        users: totalUsers,
        posts: {
          total: totalPosts,
          pending: pendingPosts
        },
        comments: totalComments
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi lấy thống kê" });
  }
};