// controllers/admin/dashboardController.js
const User = require("../../models/User");
const Post = require("../../models/Post");
const Comment = require("../../models/Comment");

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers, 
      totalPosts, 
      pendingPosts, 
      totalComments,
      latestPosts 
    ] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Post.countDocuments({ status: "pending" }),
      Comment.countDocuments(),
      Post.find().sort({ created_at: -1 }).limit(5).lean()
    ]);

    res.json({
      success: true,
      data: {
        counts: {
          users: totalUsers,
          posts: totalPosts,
          pending: pendingPosts,
          comments: totalComments
        },
        latest_activities: latestPosts 
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi Dashboard" });
  }
};