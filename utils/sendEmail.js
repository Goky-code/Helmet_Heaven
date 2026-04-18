import nodemailer from "nodemailer";

const sendEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Verification Code",
      html: `
        <h2>OTP Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP will expire in 2 minutes.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    console.log("OTP sent to email");

  } catch (error) {
    console.log("Email error:", error);
  }
};

export default sendEmail;