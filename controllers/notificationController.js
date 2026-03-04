const Notification = require("../models/Notification");
const User = require("../models/User");
const { toPublicUrl } = require("../utils/imageHelper");

// 1. LẤY DANH SÁCH THÔNG BÁO
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = String(req.user.id);

    const notifications = await Notification.find({ recipient_id: userId })
      .sort({ created_at: -1 })
      .limit(50)
      .lean();

    const actorIds = [...new Set(notifications.map(n => n.actor_id).filter(Boolean))];
    const actors = await User.find({ id: { $in: actorIds } }).select("id name avatar").lean();
    const actorMap = new Map(actors.map(u => [u.id, u]));

    const unreadCount = await Notification.countDocuments({ 
      recipient_id: userId, 
      read: false 
    });

   
    const formatAvatar = (path) => {
      if (!path) return null;
      if (path.startsWith('http')) return path; 
      return toPublicUrl(req, path); 
    };

    const data = notifications.map(n => {
      const actor = actorMap.get(n.actor_id);
      
      return {
        id: n.id || n._id.toString(),
        type: n.kind, 
        targetTitle: n.post_title,
        content: n.content, 
        createdAt: n.created_at, 
        isRead: n.read,
        postImage: n.post_image ? toPublicUrl(req, n.post_image) : null, 
        postId: n.post_id, 
        actorId: n.actor_id,
        user: actor ? {
          id: actor.id,
          name: actor.name,
          avatar: formatAvatar(actor.avatar) 
        } : { name: "Hệ thống DailyCook", avatar: null }
      };
    });

    res.status(200).json({ 
      success: true, 
      unreadCount, 
      data 
    });
  } catch (e) {
    console.error("NOTIFICATION ERROR:", e);
    res.status(500).json({ success: false, message: "Lỗi lấy danh sách thông báo" });
  }
};

// 2. ĐÁNH DẤU ĐÃ ĐỌC
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params; 
    const userId = String(req.user.id);
    
    const filter = { recipient_id: userId };

    if (id !== "all") {
      filter.id = id; 
    }

    const result = await Notification.updateMany(filter, { $set: { read: true } });

    res.json({ 
      success: true, 
      message: id === "all" ? "Đã đánh dấu tất cả là đã đọc" : "Đã đọc thông báo",
      count: result.modifiedCount
    });
  } catch (e) {
    console.error("MARK AS READ ERROR:", e);
    res.status(500).json({ success: false, message: "Lỗi cập nhật trạng thái thông báo" });
  }
};