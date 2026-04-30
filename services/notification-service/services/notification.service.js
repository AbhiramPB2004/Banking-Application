const Notification = require("../models/notification.model");
const { sendEmail } = require("../adapters/emailAdapters");

async function sendNotification({
  user_id,
  type,
  recipient,
  message,
}) {
  let status = "pending";

  try {
    if (type === "email") {
      await sendEmail(recipient, message);
    }

    status = "sent";
  } catch (err) {
    console.error("Notification Error:", err.message);
    status = "failed";
  }

  return await Notification.create({
    user_id,
    type,
    recipient,
    message,
    status,
  });
}

module.exports = {
  sendNotification,
};