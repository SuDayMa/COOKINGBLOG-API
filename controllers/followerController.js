const Follower = require("../../models/Follower"); 
const User = require("../../models/User");         
const Notification = require("../../models/Notification");
const { toPublicUrl } = require("../../utils/imageHelper");

exports.toggleFollow = async (req, res) => {
  try {
    const { followingId } = req.body; 
    const followerId = String(req.user.id);  

    if (followerId === followingId) {
      return res.status(400).json({ success: false, message: "Bạn không thể theo dõi chính mình" });
    }

    const targetUser = await User.findOne({ id: followingId });
    if (!targetUser) return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });

    const existingFollow = await Follower.findOne({ 
      follower_id: followerId, 
      following_id: followingId 
    });

    if (existingFollow) {
      await Follower.deleteOne({ _id: existingFollow._id });

      await Promise.all([
        User.findOneAndUpdate({ id: followingId }, { $inc: { followerCount: -1 } }),
        User.findOneAndUpdate({ id: followerId }, { $inc: { followingCount: -1 } })
      ]);

      return res.status(200).json({ success: true, message: "Đã bỏ theo dõi", isFollowing: false });
    } else {
      await Follower.create({ 
        id: `follow-${Date.now()}`,
        follower_id: followerId, 
        following_id: followingId 
      });

      await Promise.all([
        User.findOneAndUpdate({ id: followingId }, { $inc: { followerCount: 1 } }),
        User.findOneAndUpdate({ id: followerId }, { $inc: { followingCount: 1 } })
      ]);

      await Notification.create({
        id: `noti-${Date.now()}`,
        kind: "follow",
        actor_id: followerId,
        recipient_id: followingId,
        content: "đã bắt đầu theo dõi bạn",
        read: false
      });

      return res.status(200).json({ success: true, message: "Đã theo dõi thành công", isFollowing: true });
    }
  } catch (e) {
    console.error("FOLLOW ERROR:", e);
    res.status(500).json({ success: false, message: "Lỗi hệ thống xử lý Follow" });
  }
};

exports.getFollowingList = async (req, res) => {
  try {
    const { userId } = req.params;
    const list = await Follower.find({ follower_id: userId }).lean();
    
    const userIds = list.map(f => f.following_id);
    const users = await User.find({ id: { $in: userIds } })
      .select("id name avatar bio followerCount")
      .lean();

    const data = users.map(u => ({
      ...u,
      avatar: toPublicUrl(req, u.avatar)
    }));

    res.status(200).json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi lấy danh sách đang theo dõi" });
  }
};

exports.getFollowerList = async (req, res) => {
  try {
    const { userId } = req.params;
    const list = await Follower.find({ following_id: userId }).lean();
    
    const userIds = list.map(f => f.follower_id);
    const users = await User.find({ id: { $in: userIds } })
      .select("id name avatar bio followerCount")
      .lean();

    const data = users.map(u => ({
      ...u,
      avatar: toPublicUrl(req, u.avatar)
    }));

    res.status(200).json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi lấy danh sách người theo dõi" });
  }
};