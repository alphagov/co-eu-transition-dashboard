const { services } = require('config');
const logger = require('services/logger');
const Sequelize = require('sequelize');

const up = async (query) => {
  await query.createTable('tag', {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: Sequelize.DataTypes.STRING(45),
      allowNull: true,
      unique: true
    }
  }, { charset: services.mysql.charset });

  await query.createTable('tag_entity', {
    entity_id: {
      type: Sequelize.DataTypes.INTEGER,
      references: {
        model: 'entity',
        key: 'id'
      },
      onUpdate: 'cascade',
      onDelete: 'cascade'
    },
    tag_id: {
      type: Sequelize.DataTypes.INTEGER,
      references: {
        model: 'tag',
        key: 'id'
      },
      onUpdate: 'cascade',
      onDelete: 'cascade'
    }
  }, { charset: services.mysql.charset });
};

const down = async (query) => {
  try {
    await query.dropTable('tag_entity');
  } catch (error) {
    logger.error(`Error rolling back ${error}`);
  }

  try {
    await query.dropTable('tag');
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
