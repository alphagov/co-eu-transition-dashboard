const cron = require('node-cron');
const upcomingMilestones = require('./upcomingMilestones');
const dailyUpdates = require('./dailyUpdates');
const logger = require('services/logger');
const config = require('config');

cron.schedule(config.notify.cron.missedMilestones, upcomingMilestones.notifyUpcomingMilestones);
logger.info(`Missed milestone notifications active`);
cron.schedule(config.notify.cron.dailyUpdates, dailyUpdates.notifyDailyUpdates);
logger.info(`Measures updated today notifications active`);