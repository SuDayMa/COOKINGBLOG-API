const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465, // Chuyển sang cổng 465
  secure: true, // Phải là true khi dùng cổng 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  family: 4, // Ép dùng IPv4
  connectionTimeout: 15000, // Đợi 15 giây
  socketTimeout: 15000,
  debug: true, // Bật debug để log chi tiết hơn nếu vẫn lỗi
  logger: true // Log quá trình kết nối vào Console của Render
});

const sendOTPEmail = async (email, otp) => {
  try {
    console.log(`📡 Đang kết nối Gmail qua cổng 465 (IPv4) tới: ${email}`);

    const mailOptions = {
      from: `"Daily Cook 🍳" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Mã xác thực tài khoản Daily Cook",
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2 style="color: #f59e0b;">Xác thực Daily Cook</h2>
          <p>Mã OTP của bạn là: <b style="font-size: 24px;">${otp}</b></p>
          <p>Mã hết hạn sau 5 phút.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ GỬI MAIL THÀNH CÔNG:", info.response);
    return info;
  } catch (error) {
    console.error("🔥 LỖI SMTP GMAIL:", error.message);
    throw error;
  }
};

module.exports = { sendOTPEmail };