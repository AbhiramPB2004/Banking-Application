const dns = require("dns");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 100  00,
  socketTimeout: 10000,
  lookup: (hostname, options, callback) =>
    dns.lookup(hostname, { family: 4 }, callback),
});

const sendEmail = async (to, subject, message) => {
  try {
    console.log("Sending email to:", to);

    const info = await transporter.sendMail({
      from: `"Banking App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: message,
    });

    console.log("Email sent:", info.messageId);
  } catch (error) {
    console.error("Email Error:", error.message);
    throw error;
  }
};

module.exports = { sendEmail };
