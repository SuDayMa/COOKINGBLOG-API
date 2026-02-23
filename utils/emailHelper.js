const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Sử dụng TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // --- CẤU HÌNH ĐẶC TRỊ LỖI ENETUNREACH TRÊN RENDER ---
  family: 4, // Bắt buộc dùng IPv4 (Fix lỗi IP 2607:f8b0...)
  connectionTimeout: 20000, 
  greetingTimeout: 20000,
  socketTimeout: 20000,
  tls: {
    rejectUnauthorized: false, 
    minVersion: "TLSv1.2"
  }
});

const sendOTPEmail = async (email, otp) => {
  try {
    console.log(`📡 Đang chuẩn bị gửi mail tới: ${email} (Dùng IPv4)...`);

    const mailOptions = {
      from: `"Daily Cook 🍳" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Mã xác thực tài khoản Daily Cook",
      html: `
        <div style="font-family: Arial; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #f59e0b;">Xác thực tài khoản Daily Cook</h2>
          <p>Mã OTP của bạn là: <b style="font-size: 24px; color: #333;">${otp}</b></p>
          <p>Mã có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ [Gmail Service] Gửi thành công:", info.response);
    return info;
  } catch (error) {
    console.error("🔥 [Gmail Service] LỖI KẾT NỐI:", error.message);
    throw error;
  }
};

module.exports = { sendOTPEmail };