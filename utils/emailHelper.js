const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // Sử dụng service mặc định của Nodemailer cho Gmail
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  pool: true, // Sử dụng kết nối duy trì để tránh timeout
  maxConnections: 1,
  connectionTimeout: 5000, // Chỉ đợi 5 giây
});

const sendOTPEmail = async (email, otp) => {
  try {
    // LOG để kiểm tra biến môi trường có tồn tại không
    console.log(`📡 Đang thử gửi OTP tới: ${email} bằng User: ${process.env.EMAIL_USER ? "Đã có" : "TRỐNG"}`);

    const mailOptions = {
      from: `"Daily Cook 🍳" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Mã xác thực Daily Cook",
      text: `Mã OTP của bạn là: ${otp}`,
      html: `<b>Mã OTP của bạn là: ${otp}</b>`,
    };

    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("🔥 LỖI GỬI MAIL:", error.message);
    throw error;
  }
};

module.exports = { sendOTPEmail };