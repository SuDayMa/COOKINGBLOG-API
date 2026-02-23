const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000, 
  socketTimeout: 10000,
  dnsTimeout: 10000,
  family: 4, 
  tls: {
    rejectUnauthorized: false, 
    minVersion: 'TLSv1.2'
  }
});

const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"Daily Cook 🍳" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Mã xác thực tài khoản Daily Cook",
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2>Mã OTP của bạn là: <span style="color: #f59e0b;">${otp}</span></h2>
          <p>Mã có hiệu lực trong 5 phút.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ [Email Service] Gửi thành công:", info.response);
    return info;
  } catch (error) {
    // Log chi tiết để Su dễ theo dõi
    console.error("🔥 [Email Service] Lỗi kết nối Gmail:", error.message);
    throw error; 
  }
};

module.exports = { sendOTPEmail };