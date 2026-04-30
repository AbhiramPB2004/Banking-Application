const Notification = require("../models/notification.model");
const { sendEmail } = require("../adapters/emailAdapters");
const { sendSMS } = require("../adapters/smsAdapters");

exports.sendNotification = async ({
  user_id,
  type,
  recipient,
  message,
}) => {
  let status = "pending";

  try {
    if (type === "email") {
      await sendEmail(recipient, "Notification", message);
    } else if (type === "sms") {
      await sendSMS(recipient, message);
    }

    status = "sent";
  } catch (err) {
    console.error(err);
    status = "failed";
  }

  return await Notification.create({
    user_id,
    type,
    recipient,
    message,
    status,
  });
};