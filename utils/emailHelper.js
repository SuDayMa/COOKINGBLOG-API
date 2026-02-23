const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  // Sử dụng địa chỉ IP trực tiếp của Gmail SMTP để tránh lỗi phân giải IPv6 trên Render
  host: "74.125.204.108", 
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Cấu hình cực kỳ quan trọng
  family: 4, 
  connectionTimeout: 20000, 
  greetingTimeout: 20000,
  socketTimeout: 20000,
  tls: {
    servername: 'smtp.gmail.com', // Bắt buộc phải có dòng này để khớp chứng chỉ SSL
    rejectUnauthorized: false
  }
});

const sendOTPEmail = async (email, otp) => {
  try {
    console.log(`📡 Đang dùng IP trực tiếp để gửi OTP tới: ${email}`);

    const mailOptions = {
      from: `"Daily Cook 🍳" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Mã xác thực Daily Cook",
      html: `<h1 style="color: #f59e0b;">Mã OTP của bạn là: ${otp}</h1>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ GỬI THÀNH CÔNG RỒI SỰ ƠI!");
    return info;
  } catch (error) {
    console.error("🔥 LỖI SMTP GMAIL:", error.message);
    throw error;
  }
};

module.exports = { sendOTPEmail };