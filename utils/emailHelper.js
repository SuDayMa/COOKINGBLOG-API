const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // false cho cổng 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // THÊM ĐOẠN NÀY ĐỂ FIX LỖI TIMEOUT TRÊN CLOUD
  connectionTimeout: 10000, // 10 giây không kết nối được thì báo lỗi ngay
  greetingTimeout: 10000,
  tls: {
    rejectUnauthorized: false, // Bỏ qua lỗi chứng chỉ nếu có
  }
});

const sendOTPEmail = async (email, otp) => {    
  try {
    const mailOptions = {
      from: `"Daily Cook 🍳" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Mã xác thực tài khoản Daily Cook",
      html: `<h1>Mã OTP của bạn là: ${otp}</h1>`, 
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent: " + info.response);
    return info;
  } catch (error) {
    console.error("🔥 NODEMAILER ERROR:", error.message);
    throw error; // Ném lỗi để Controller bắt được
  }
};

module.exports = { sendOTPEmail };