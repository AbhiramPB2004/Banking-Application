// /services/investment-service/index.js

const express = require("express");
const router = require("./routes/investment.routes");
const { startNavUpdater } = require("./jobs/navUpdater");
const {
  seedDefaultInvestmentProducts,
} = require("./jobs/productSeeder");

const app = express();

app.use(express.json());
app.use("/", router);

async function initializeJobs() {
  try {
    await seedDefaultInvestmentProducts();
    startNavUpdater();
    console.log("Investment service jobs initialized.");
  } catch (error) {
    console.error("Failed to initialize investment jobs:", error.message);
  }
}

module.exports = {
  app,
  initializeJobs,
};
