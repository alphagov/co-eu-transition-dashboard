const logger = require('services/logger');
const config = require('config');
const Sequelize = require('sequelize');

const migrate = async (query) => {
  const hasColumn = await query.sequelize.query(`SELECT * FROM information_schema.COLUMNS WHERE TABLE_NAME = 'user' AND COLUMN_NAME = 'is_active'`);
  if(hasColumn[0][0] === undefined) {
    logger.info(`Adding is_active column to user table`);
    await query.addColumn(
      'user',
      'is_active',
      {
        type: Sequelize.DataTypes.BOOLEAN,
        defaultValue: true
      }
    );
  } else {
    logger.info(`is_active column already exists on user table`);
  }
};

const up = async (query) => {
  try {
    await migrate(query);
  } catch (error) {
    logger.error(`Error migrating ${error}`);
    throw error;
  }
};

module.exports = {
  up
};
