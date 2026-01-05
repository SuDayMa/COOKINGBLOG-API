const Notification = require("../models/Notification");
const User = require("../models/User");
const { toPublicUrl } = require("../utils/imageHelper");

// Lấy danh sách thông báo của tôi
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient_id: req.user.id })
      .sort({ created_at: -1 })
      .limit(50)
      .lean();

    // Lấy thông tin của những người thực hiện hành động (actors)
    const actorIds = [...new Set(notifications.map(n => n.actor_id))];
    const actors = await User.find({ id: { $in: actorIds } }).select("id name avatar").lean();
    const actorMap = new Map(actors.map(u => [u.id, u]));

    const data = notifications.map(n => {
      const actor = actorMap.get(n.actor_id);
      return {
        ...n,
        actor: actor ? {
          id: actor.id,
          name: actor.name,
          avatar: toPublicUrl(req, actor.avatar)
        } : null
      };
    });

    res.status(200).json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi lấy thông báo" });
  }
};

// Đánh dấu đã đọc tất cả hoặc một thông báo
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params; // Nếu có id thì đọc 1, không thì đọc tất cả
    const filter = { recipient_id: req.user.id };
    if (id !== "all") filter.id = id;

    await Notification.updateMany(filter, { read: true });
    res.json({ success: true, message: "Đã đánh dấu đã đọc" });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi cập nhật" });
  }
};