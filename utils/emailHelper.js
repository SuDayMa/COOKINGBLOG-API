const { Resend } = require('resend');

// Khởi tạo Resend với API Key từ Render
const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTPEmail = async (email, otp) => {
  try {
    console.log(`📡 Đang gửi OTP qua Resend API tới: ${email}`);

    const { data, error } = await resend.emails.send({
      from: 'Daily Cook <onboarding@resend.dev>', // Dùng email này khi chưa có domain riêng
      to: email,
      subject: 'Mã xác thực tài khoản Daily Cook',
      html: `
        <div style="font-family: Arial; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #f59e0b;">Xác thực Daily Cook</h2>
          <p>Mã OTP của bạn là: <b style="font-size: 24px;">${otp}</b></p>
          <p>Mã hết hạn sau 5 phút.</p>
        </div>
      `,
    });

    if (error) {
      console.error("🔥 Lỗi Resend:", error.message);
      throw new Error(error.message);
    }

    console.log("✅ [Resend] GỬI MAIL THÀNH CÔNG!", data.id);
    return data;
  } catch (error) {
    console.error("🔥 [Resend Exception]:", error.message);
    throw error;
  }
};

module.exports = { sendOTPEmail };