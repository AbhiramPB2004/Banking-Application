/**
 * /services/credit-card-service/index.js
 * Service entry point for PostgreSQL environment.
 */
const express = require('express');
const cron = require('node-cron');
const { connectDB, sequelize } = require('../../shared/config/db'); 
const logger = require('../../shared/utils/logger'); 

const creditCardRoutes = require('./routes/creditCard.routes');
const billingJob = require('./jobs/billingCycle');

const app = express();
app.use(express.json()); 

app.use('/api/credit-cards', creditCardRoutes); 

// Job scheduling for billing 
cron.schedule('0 0 1 * *', async () => {
    logger.info("Executing billing cycle job...");
    await billingJob();
});

const startService = async () => {
    try {
        await connectDB(); 
        
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
module.exports = app; 