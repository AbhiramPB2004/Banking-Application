const express = require("express");
const cookieParser = require("cookie-parser");

const fdRoutes = require("./routes/fd.routes");

const {
  connectDB,
} = require("../shared/config/database"); // ✅ correct

const app = express();

app.use(express.json());
app.use(cookieParser()); // ✅ REQUIRED for cookies

app.use("/fd", fdRoutes);

const PORT = 5005;

connectDB(); // ✅ DB connection

app.listen(PORT, () => {
  console.log(`FD Service running on port ${PORT}`);
});