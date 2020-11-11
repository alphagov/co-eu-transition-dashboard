const logger = require('services/logger');

const up = async (query) => {
  await query.bulkInsert('role', [
    {
      name: 'all_data'
    }
  ]);
};

const down = async (query) => {
  try {
    await query.sequelize.query("DELETE FROM role WHERE name = 'all_data'");
  } catch (error) {
    logger.error(`Error rolling back ${error}`);
  }
};

module.exports = {
  up: async (query) => {
    try {
      await up(query);
    } catch (error) {
      logger.error(`Error migrating ${error}`);
      logger.error(`Rolling back changes`);
      await down(query);
      throw error;
    }
  },
  down
}
