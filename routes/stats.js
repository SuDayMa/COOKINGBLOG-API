const express = require("express");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");

const router = express.Router();

// GET /api/stats
router.get("/", auth, adminOnly, async (req, res) => {
  const [usersTotal, usersBlocked, postsTotal, postsPending, postsHidden, commentsTotal, commentsHidden] =
    await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ is_blocked: true }),
      Post.countDocuments({}),
      Post.countDocuments({ status: "pending" }),
      Post.countDocuments({ status: "hidden" }),
      Comment.countDocuments({}),
      Comment.countDocuments({ status: "hidden" }),
    ]);

  return res.status(200).json({
    success: true,
    data: {
      users: { total: usersTotal, blocked: usersBlocked },
      posts: { total: postsTotal, pending: postsPending, hidden: postsHidden },
      comments: { total: commentsTotal, hidden: commentsHidden },
    },
  });
});

module.exports = router;
