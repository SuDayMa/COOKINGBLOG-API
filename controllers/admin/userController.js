const User = require("../../models/User");
const { toPublicUrl } = require("../../utils/imageHelper");

// 1. LẤY DANH SÁCH NGƯỜI DÙNG 
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

    const [total, rows] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select("-password") 
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
    ]);

    const items = rows.map(u => ({
      ...u,
      id: u.id || u._id.toString(), 
      avatar: u.avatar ? toPublicUrl(req, u.avatar) : null,
      role: u.role || "user",
      is_blocked: !!u.is_blocked,
      postCount: u.postCount || 0,
      followerCount: u.followerCount || 0
    }));

    res.status(200).json({ 
      success: true, 
      data: { page, limit, total, items } 
    });
  } catch (e) {
    console.error("ADMIN GET USERS ERROR:", e); 
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi lấy danh sách người dùng" });
  }
};

// 2. KHÓA HOẶC MỞ KHÓA TÀI KHOẢN
exports.updateUserStatus = async (req, res) => {
  try {
    const { is_blocked } = req.body;
    const { id } = req.params; 

    const user = await User.findOneAndUpdate(
      { id: id }, 
      { $set: { is_blocked: !!is_blocked } }, 
      { new: true }
    ).select("-password").lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    res.json({ 
      success: true, 
      message: is_blocked ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản",
      data: {
        ...user,
        id: user.id || user._id.toString(),
        avatar: user.avatar ? toPublicUrl(req, user.avatar) : null,
        is_blocked: !!user.is_blocked
      } 
    });
  } catch (e) {
    console.error("ADMIN UPDATE USER ERROR:", e);
    res.status(500).json({ success: false, message: "Lỗi khi cập nhật trạng thái người dùng" });
  }
};

// 3. XÓA NGƯỜI DÙNG
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await User.deleteOne({ id: id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }
    
    res.json({ success: true, message: "Đã xóa người dùng thành công khỏi hệ thống" });
  } catch (e) {
    console.error("ADMIN DELETE USER ERROR:", e);
    res.status(500).json({ success: false, message: "Lỗi máy chủ khi thực hiện xóa" });
  }
};