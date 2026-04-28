const express = require("express");
const dotenv = require("dotenv");

const authRoutes = require("./Routes/auth.routes");

dotenv.config();

const app = express();

app.use(express.json());

// Gateway routes
app.use("/auth", authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});