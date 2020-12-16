const logger = require('services/logger');
const Sequelize = require('sequelize');

const migrate = async (query) => {
  await query.addColumn(
    'user',
    'is_active',
    {
      type: Sequelize.DataTypes.BOOLEAN,
      defaultValue: true
    }
  );
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

const down = async (query) => {
  await query.removeColumn(
    'user',
    'is_active'
  );
};

module.exports = {
  up,
  down
};
