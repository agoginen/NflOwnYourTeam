const cron = require('node-cron');
const NFLDataService = require('./nflDataService');
const PayoutService = require('./payoutService');

const setupCronJobs = () => {
  console.log('🕐 Setting up cron jobs...');

  // Update NFL data every Tuesday at 6 AM (after Monday Night Football)
  cron.schedule('0 6 * * 2', async () => {
    console.log('📊 Running weekly NFL data update...');
    try {
      await NFLDataService.updateWeeklyResults();
      console.log('✅ NFL data update completed successfully');
    } catch (error) {
      console.error('❌ Error updating NFL data:', error);
    }
  }, {
    timezone: "America/New_York"
  });

  // Update playoff standings every day during playoffs (December-February)
  cron.schedule('0 8 * 12,1,2 *', async () => {
    console.log('🏆 Running playoff standings update...');
    try {
      await NFLDataService.updatePlayoffStandings();
      console.log('✅ Playoff standings update completed successfully');
    } catch (error) {
      console.error('❌ Error updating playoff standings:', error);
    }
  }, {
    timezone: "America/New_York"
  });

  // Calculate and distribute payouts every Wednesday at 7 AM
  cron.schedule('0 7 * * 3', async () => {
    console.log('💰 Running payout calculations...');
    try {
      await PayoutService.calculateWeeklyPayouts();
      console.log('✅ Payout calculations completed successfully');
    } catch (error) {
      console.error('❌ Error calculating payouts:', error);
    }
  }, {
    timezone: "America/New_York"
  });

  // Health check every hour
  cron.schedule('0 * * * *', async () => {
    console.log('🏥 Running system health check...');
    try {
      // Check database connection
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) {
        console.warn('⚠️ Database connection issue detected');
      }
      
      // Log memory usage
      const memUsage = process.memoryUsage();
      const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      
      if (memUsageMB > 500) { // Alert if using more than 500MB
        console.warn(`⚠️ High memory usage detected: ${memUsageMB}MB`);
      }
      
      console.log(`✅ System health check passed - Memory: ${memUsageMB}MB`);
    } catch (error) {
      console.error('❌ System health check failed:', error);
    }
  });

  // Clean up old auction data every Sunday at midnight
  cron.schedule('0 0 * * 0', async () => {
    console.log('🧹 Running cleanup tasks...');
    try {
      await NFLDataService.cleanupOldData();
      console.log('✅ Cleanup tasks completed successfully');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }, {
    timezone: "America/New_York"
  });

  // Backup reminder every day at 2 AM
  cron.schedule('0 2 * * *', () => {
    console.log('💾 Daily backup reminder - Ensure database backup is running');
  }, {
    timezone: "America/New_York"
  });

  console.log('✅ Cron jobs setup completed');
};

module.exports = setupCronJobs;
