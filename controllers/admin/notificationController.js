const Notification = require("../../models/Notification");

exports.sendPrivateNotification = async (req, res) => {
  try {
    const { userId, title, message } = req.body; 

    // Kiểm tra dữ liệu đầu vào
    if (!userId || !message) {
      return res.status(400).json({ 
        success: false, 
        message: "Sự ơi, Admin quên nhập ID người dùng hoặc nội dung rồi!" 
      });
    }

    // Tạo thông báo mới dựa trên Schema bạn đã có
    const newNotification = await Notification.create({
      id: `admin-msg-${Date.now()}`, 
      recipient_id: String(userId),
      actor_id: String(req.user.id), // ID của Admin đang thực hiện lệnh
      kind: 'warning', // Bạn có thể để mặc định là warning hoặc system
      post_title: title || "Thông báo từ Ban quản trị", 
      content: message, 
      read: false
    });

    res.status(200).json({ 
      success: true, 
      message: "Gửi thông báo thành công rực rỡ!",
      data: newNotification 
    });
  } catch (e) {
    console.error("Lỗi gửi thông báo Admin:", e.message);
    res.status(500).json({ success: false, message: "Lỗi hệ thống: " + e.message });
  }
};