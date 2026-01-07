const User = require("../../models/User");
const { toPublicUrl } = require("../../utils/imageHelper");

exports.getAdminUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 200);
    const q = (req.query.q || "").trim();

    const filter = {};
    if (q) {
      filter.$or = [
        { name: new RegExp(q, "i") },
        { email: new RegExp(q, "i") }
      ];
    }

    const total = await User.countDocuments(filter);
    const rows = await User.find(filter)
      .select("-password") 
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const items = rows.map(u => ({
      ...u,
      id: u.id || u._id.toString(), 
      avatar: u.avatar ? toPublicUrl(req, u.avatar) : null,
      role: u.role || "user",
      is_blocked: !!u.is_blocked
    }));

    res.status(200).json({ 
      success: true, 
      data: { page, limit, total, items } 
    });
  } catch (e) {
    console.error("GET USERS ERROR:", e); 
    res.status(500).json({ success: false, message: "Lỗi Server khi lấy danh sách người dùng" });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { is_blocked } = req.body;
    // Tìm theo id (UUID) và cập nhật
    const user = await User.findOneAndUpdate(
      { id: req.params.id }, 
      { is_blocked }, 
      { new: true }
    ).select("-password").lean();

    if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });

    res.json({ 
      success: true, 
      data: {
        ...user,
        id: user.id || user._id.toString(),
        avatar: user.avatar ? toPublicUrl(req, user.avatar) : null,
        is_blocked: !!user.is_blocked
      } 
    });
  } catch (e) {
    console.error("UPDATE USER ERROR:", e);
    res.status(500).json({ success: false, message: "Lỗi khi cập nhật trạng thái" });
  }
};