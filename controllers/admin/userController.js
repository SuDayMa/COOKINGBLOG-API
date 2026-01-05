const User = require("../../models/User");
const { toPublicUrl } = require("../../utils/imageHelper");

exports.getAllUsers = async (req, res) => {
  try {
    // 1. Lấy các tham số phân trang & tìm kiếm từ query
    const page = Math.max(parseInt(req.query.page || "1"), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20"), 1), 50);
    const q = (req.query.q || "").trim();

    // 2. Tạo bộ lọc tìm kiếm theo tên hoặc email
    const filter = {};
    if (q) {
      filter.$or = [
        { name: new RegExp(q, "i") },
        { email: new RegExp(q, "i") }
      ];
    }

    // 3. Thực hiện truy vấn
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select("id name email role avatar created_at is_blocked") // Thêm is_blocked để admin dễ quản lý
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // 4. Format lại URL ảnh
    const items = users.map(user => ({
      ...user,
      avatar: toPublicUrl(req, user.avatar)
    }));

    res.json({ 
      success: true, 
      data: { 
        total, 
        page, 
        limit, 
        items 
      } 
    });
  } catch (e) {
    console.error("ADMIN GET USERS ERROR:", e);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi lấy danh sách user" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const result = await User.findOneAndDelete({ id: req.params.id });
    if (!result) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    
    res.json({ success: true, message: "Đã xóa người dùng thành công" });
  } catch (e) {
    res.status(400).json({ success: false, message: "Không thể xóa người dùng" });
  }
};