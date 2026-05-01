// /shared/config/database.js

const { Sequelize } = require("sequelize");
require("dotenv").config();

/**
 * Sequelize instance for Banking Backend
 * Centralized PostgreSQL connection
 */

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      logging: false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false, // Required for Neon/Render connections
        },
      },
    })
  : new Sequelize(
      process.env.DB_NAME,       // Database name
      process.env.DB_USER,       // PostgreSQL username
      process.env.DB_PASSWORD,   // PostgreSQL password
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: "postgres",
        logging: false, // Disable SQL logs
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
        dialectOptions: {
          ssl: false, // Local DB usually doesn't need SSL
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
  sequelize,
  connectDB,
};