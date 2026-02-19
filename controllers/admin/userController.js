const User = require("../../models/User"); 
const { toPublicUrl } = require("../../utils/imageHelper");

// ADMIN LẤY DANH SÁCH NGƯỜI DÙNG
exports.getAdminUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1"), 1);
    const limit = Math.min(parseInt(req.query.limit || "20"), 100);
    const q = (req.query.q || "").trim();

    const filter = {};
    if (q) {
      filter.$or = [{ name: new RegExp(q, "i") }, { email: new RegExp(q, "i") }];
    }

    const [total, rows] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter).select("-password").sort({ created_at: -1 }).skip((page - 1) * limit).limit(limit).lean()
    ]);

    const items = rows.map(u => ({
      ...u,
      id: u._id,
      avatar: toPublicUrl(req, u.avatar)
    }));

    res.status(200).json({ success: true, data: { page, limit, total, items } });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi lấy danh sách người dùng" });
  }
};

// ADMIN KHÓA/MỞ KHÓA TÀI KHOẢN
exports.updateUserStatus = async (req, res) => {
  try {
    const { is_blocked } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id, 
      { $set: { is_blocked: !!is_blocked } },
      { new: true }
    ).select("-password").lean();

    if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });

    res.json({ 
      success: true, 
      message: is_blocked ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản",
      data: { ...user, id: user._id }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi khi cập nhật trạng thái" });
  }
};

// ADMIN XÓA NGƯỜI DÙNG
exports.deleteUser = async (req, res) => {
  try {
    const result = await User.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    res.json({ success: true, message: "Đã xóa người dùng thành công" });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ khi xóa" });
  }
};