// /shared/config/database.js

const { Sequelize } = require("sequelize");
require("dotenv").config();

/**
 * Sequelize instance for Banking Backend
 * Centralized PostgreSQL connection
 */

const sequelize = new Sequelize(
  process.env.DB_NAME,       // Database name
  process.env.DB_USER,       // PostgreSQL username
  process.env.DB_PASSWORD,   // PostgreSQL password
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",

    logging: false, // Disable SQL logs (set true for debugging)

    pool: {
      max: 10,       // Maximum active connections
      min: 0,
      acquire: 30000,
      idle: 10000,
    },

    dialectOptions: {
      ssl: process.env.DB_SSL === "true" ? {
      require: true,
      rejectUnauthorized: false // Common for cloud providers like Supabase/Render
      } : false,
    },
  }
);

/**
 * Test database connection
 */
async function connectDB() {
  try {
    
    await sequelize.authenticate();
    console.log("PostgreSQL connected successfully.");
  } catch (error) {
    console.log(process.env.DB_PASSWORD);
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
}

module.exports = {
  sequelize, // The instance for defining models
  connectDB, // The function to bootstrap the service
};