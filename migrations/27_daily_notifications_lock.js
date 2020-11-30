const logger = require('services/logger');
const config = require('config');

const migrate = async (query) => {
  query.bulkInsert('dashboard_locks', [{
    name: config.locks.dailyUpdatesNotifications
  }]);
};

const down = async (query) => {
  try {
    await query.destroy({ where: { name: config.locks.dailyUpdatesNotifications } });
  } catch (error) {
    logger.error(`Error rolling back ${error}`);
  }
};

const up = async (query) => {
  try {
    await migrate(query);
  } catch (error) {
    logger.error(`Error migrating ${error}`);
    logger.error(`Rolling back changes`);
    await down(query);
    throw error;
  }
};

module.exports = {
  up,
  down
}
