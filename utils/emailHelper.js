const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const sendOTPEmail = async (email, otp) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN
    });

    // Ép lấy Access Token mới
    const { token } = await oauth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: token,
      },
      // KHÓA CHỐT Ở ĐÂY: Ép dùng IPv4 để tránh lỗi ENETUNREACH
      family: 4 
    });

    const mailOptions = {
      from: `"Daily Cook 🍳" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Mã xác thực tài khoản Daily Cook",
      html: `<h2 style="color: #f59e0b;">Mã OTP của bạn là: ${otp}</h2>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ [Gmail API] GỬI OTP THÀNH CÔNG!");
    return info;
  } catch (error) {
    console.error("🔥 [Gmail API Error]:", error.message);
    throw error;
  }
};

module.exports = { sendOTPEmail };