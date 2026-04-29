/**
 * /services/credit-card-service/index.js
 * Service entry point for PostgreSQL environment.
 */
const express = require('express');
const cron = require('node-cron');
const { connectDB, sequelize } = require('../../shared/config/db'); // [cite: 1602, 2019]
const logger = require('../../shared/utils/logger'); // [cite: 110, 1599]

const creditCardRoutes = require('./routes/creditcard.routes');
const billingJob = require('./jobs/billingCycle');

const app = express();
app.use(express.json()); // [cite: 1586]

app.use('/api/credit-cards', creditCardRoutes); // [cite: 1587]

// Job scheduling for billing [cite: 2482, 2484]
cron.schedule('0 0 1 * *', async () => {
    logger.info("Executing billing cycle [cite: 2482]");
    await billingJob();
});

const startService = async () => {
    try {
        await connectDB(); // [cite: 70]
        
        // Synchronize models with PostgreSQL tables 
        await sequelize.sync({ alter: true }); 
        
        app.listen(process.env.PORT || 5005, () => {
            logger.info(`Service running on port ${process.env.PORT || 5005} `);
        });
    } catch (err) {
        logger.error(`Startup failed: ${err.message} [cite: 122]`);
    }
};

startService();
module.exports = app; // [cite: 1588]