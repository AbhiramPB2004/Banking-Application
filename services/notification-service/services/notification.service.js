const Notification = require("../models/notification.model");
const { sendEmail } = require("../adapters/emailAdapters");
const { getEmailTemplate } = require("../templates/emailTemplates");

/**
 * CORE FUNCTION
 */
async function createNotification({ user_id, recipient, template, data }) {
  let status = "pending";

  try {
    console.log("🔔 Creating notification:", template, "for", recipient);

    // Get template
    const templateData = getEmailTemplate(template, data);

    if (!templateData) {
      throw new Error("Invalid email template");
    }

  const subject = templateData.subject || "Bank Notification";
  const html = templateData.html || "<p>Notification</p>";
  const text = templateData.text || "Notification";

    console.log("📤 Sending email...");
    
    // Send Email
    await sendEmail(recipient, subject, html);

    console.log("✅ Email sent successfully");

    status = "sent";

    return await Notification.create({
      user_id,
      type: "email",
      recipient,
      message: text,
      status,
    });

  } catch (err) {
    console.error("❌ Notification Error:", err.message);

    return await Notification.create({
      user_id,
      type: "email",
      recipient,
      message: err.message,
      status: "failed",
    });
  }
}


/**
 * REGISTER NOTIFICATION
 */
async function notifyRegister(user) {
  return await createNotification({
    user_id: user.user_id,
    recipient: user.email,
    template: "REGISTER",
    data: { name: user.full_name },
  });
}

/**
 * LOGIN NOTIFICATION
 */
async function notifyLogin(user) {
  return await createNotification({
    user_id: user.user_id,
    recipient: user.email,
    template: "LOGIN",
    data: { name: user.full_name },
  });
}

/**
 * DEBIT NOTIFICATION
 */
async function notifyDebit(user, amount) {
  return await createNotification({
    user_id: user.user_id,
    recipient: user.email,
    template: "DEBIT",
    data: { name: user.full_name, amount },
  });
}

/**
 * CREDIT NOTIFICATION
 */
async function notifyCredit(user, amount) {
  return await createNotification({
    user_id: user.user_id,
    recipient: user.email,
    template: "CREDIT",
    data: { name: user.full_name, amount },
  });
}

module.exports = {
  notifyRegister,
  notifyLogin,
  notifyDebit,
  notifyCredit,
};