const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const followerController = require("../controllers/followerController");

// API chính để follow/unfollow (Cần đăng nhập)
router.post("/toggle", auth, followerController.toggleFollow);

// Xem danh sách đang theo dõi của một ai đó (Public)
router.get("/:userId/following", followerController.getFollowingList);

module.exports = router;