const emailjs = require('@emailjs/nodejs');

const sendOTPEmail = async (email, otp) => {
  try {
    console.log(`📡 Đang gửi OTP qua EmailJS tới: ${email}`);

    const result = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      {
        to_email: email,      // Phải khớp với {{to_email}} trong Template
        otp: otp,             // Phải khớp với {{otp}} trong Template
        reply_to: "dragongamingtv2k5@gmail.com",
      },
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
      }
    );

    console.log("✅ [EmailJS] GỬI MAIL THÀNH CÔNG!", result.status);
    return result;
  } catch (error) {
    console.error("🔥 [EmailJS Error]:", error);
    throw error;
  }
};

module.exports = { sendOTPEmail };