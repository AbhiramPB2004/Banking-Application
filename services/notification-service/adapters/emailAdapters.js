const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, message) => {
  try {
    console.log("📤 Sending email to:", to);

    const info = await transporter.sendMail({
      from: `"Banking App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: `
        <div style="font-family: Arial;">
          <h2>🏦 Banking Notification</h2>
          <p>${message}</p>
        </div>
      `,
    });

    console.log("✅ Email sent:", info.messageId);
  } catch (error) {
    console.error("❌ Email Error:", error.message);
  }
};

module.exports = { sendEmail };