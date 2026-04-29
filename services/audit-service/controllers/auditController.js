// const { getAllLogs } = require("../services/auditService");

// const fetchAllLogs = async (req, res) => {
//   try {
//     const logs = await getAllLogs();
//     res.json(logs);
//   } catch (error) {
//     res.status(500).json({ message: "Failed to fetch logs" });
//   }
// };

// module.exports = {
//   fetchAllLogs
// };

const { getAllAuditLogs } = require("../services/auditService");

async function getAllLogs(req, res) {
  try {
    const logs = await getAllAuditLogs();

    return res.json(logs);
  } catch (error) {
    console.error("AUDIT ERROR:", error);

    return res.status(500).json({
      message: "Failed to fetch logs",
      error: error.message
    });
  }
}

module.exports = {
  getAllLogs   // ✅ VERY IMPORTANT
};