const { services } = require('config');
const logger = require('services/logger');
const Sequelize = require('sequelize');

const up = async (query) => {
  await query.createTable('static_export', {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    status: {
      type: Sequelize.DataTypes.ENUM('in_progress', 'complete', 'error'),
      defaultValue: 'in_progress',
      allowNull: false
    },
    url: Sequelize.DataTypes.STRING(2083),
    error: Sequelize.DataTypes.TEXT,
    created_at: {
      type: Sequelize.DataTypes.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: Sequelize.DataTypes.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    }
  }, { charset: services.mysql.charset });
};

const down = async (query) => {
  try {
    await query.dropTable('static_export');
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
