const fdService = require("../services/fd.service");

exports.createFD = async (req, res) => {
  try {
    const user_id = req.user.user_id; // ✅ correct

    const fd = await fdService.createFD(
      user_id,
      req.body
    );

    res.json({
      success: true,
      message: "FD created successfully",
      data: fd,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getFDs = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const fds = await fdService.getFDs(user_id);

    res.json({ success: true, data: fds });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getFDById = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const fd = await fdService.getFDById(
      req.params.id,
      user_id
    );

    res.json({ success: true, data: fd });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: err.message,
    });
  }
};

exports.closeFD = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const fd = await fdService.closeFD(
      req.params.id,
      user_id
    );

    res.json({
      success: true,
      message: "FD closed successfully",
      data: fd,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};