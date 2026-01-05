const Follower = require("../models/Follower");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { toPublicUrl } = require("../utils/imageHelper");

// ✅ Theo dõi hoặc Bỏ theo dõi (Toggle)
exports.toggleFollow = async (req, res) => {
  try {
    const { followingId } = req.body; // ID người định follow
    const followerId = req.user.id;   // ID của chính mình (từ middleware auth)

    if (followerId === followingId) {
      return res.status(400).json({ success: false, message: "Bạn không thể theo dõi chính mình" });
    }

    // Kiểm tra xem người kia có tồn tại không
    const targetUser = await User.findOne({ id: followingId });
    if (!targetUser) return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });

    // Kiểm tra đã follow chưa
    const existingFollow = await Follower.findOne({ follower_id: followerId, following_id: followingId });

    if (existingFollow) {
      // Đã follow -> Tiến hành Unfollow
      await Follower.deleteOne({ id: existingFollow.id });
      return res.status(200).json({ success: true, message: "Đã bỏ theo dõi", isFollowing: false });
    } else {
      // Chưa follow -> Tiến hành Follow
      await Follower.create({ follower_id: followerId, following_id: followingId });
      
      // Tạo thông báo cho người được follow
      await Notification.create({
        kind: "follow",
        actor_id: followerId,
        recipient_id: followingId,
        content: "đã bắt đầu theo dõi bạn",
        read: false
      });

      return res.status(200).json({ success: true, message: "Đã theo dõi", isFollowing: true });
    }
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

// ✅ Lấy danh sách "Đang theo dõi" (Following) của một User
exports.getFollowingList = async (req, res) => {
  try {
    const { userId } = req.params;
    const list = await Follower.find({ follower_id: userId }).lean();
    
    const userIds = list.map(f => f.following_id);
    const users = await User.find({ id: { $in: userIds } }).select("id name avatar bio").lean();

    const data = users.map(u => ({
      ...u,
      avatar: toPublicUrl(req, u.avatar)
    }));

    res.status(200).json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi lấy danh sách following" });
  }
};