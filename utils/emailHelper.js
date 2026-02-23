const nodemailer = require('nodemailer');

// Cấu hình transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Mã 16 ký tự từ App Password
  },
});

/**
 * Hàm gửi OTP chuyên nghiệp
 * @param {string} email - Email người nhận
 * @param {string} otp - Mã số xác thực
 */
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"Daily Cook 🍳" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Mã xác thực tài khoản Daily Cook",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: auto; border: 1px solid #f0f0f0; border-radius: 15px; padding: 20px;">
        <h2 style="color: #f59e0b; text-align: center;">Xác thực tài khoản</h2>
        <p style="color: #64748b; font-size: 16px; text-align: center;">Cảm ơn bạn đã tham gia cộng đồng Daily Cook. Đây là mã OTP của bạn:</p>
        <div style="background: #fff8f1; border: 2px dashed #f59e0b; border-radius: 10px; padding: 15px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #f59e0b;">${otp}</span>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">Mã này sẽ hết hạn sau 5 phút. Vui lòng không cung cấp mã này cho bất kỳ ai.</p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };