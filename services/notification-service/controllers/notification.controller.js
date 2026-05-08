const notificationService = require("../services/notification.service");

exports.send = async (req, res) => {
  try {
    const result = await notificationService.sendNotification(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};