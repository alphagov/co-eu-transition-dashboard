const { services } = require('config');
const logger = require('services/logger');
const Sequelize = require('sequelize');

const up = async (query) => {
  await query.createTable('visualisation', {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: Sequelize.DataTypes.STRING(45),
      allowNull: false,
      unique: true
    },
    template: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true,
    }
  }, { charset: services.mysql.charset });

  await query.createTable('entity_visualisation', {
    entity_id: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'entity',
        key: 'id'
      },
      onUpdate: 'cascade',
      onDelete: 'cascade'
    },
    visualisation_id: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'role',
        key: 'id'
      },
      onUpdate: 'cascade',
      onDelete: 'cascade'
    },
    config: {
      type: Sequelize.DataTypes.JSON,
      allowNull: true
    },
    priority: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    }
  }, { charset: services.mysql.charset });

  await query.createTable('category_visualisation', {
    category_id: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'category',
        key: 'id'
      },
      onUpdate: 'cascade',
      onDelete: 'cascade'
    },
    visualisation_id: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'role',
        key: 'id'
      },
      onUpdate: 'cascade',
      onDelete: 'cascade'
    },
    config: {
      type: Sequelize.DataTypes.JSON,
      allowNull: true
    }
  }, { charset: services.mysql.charset });

};

const down = async (query) => {
  try {
    await query.dropTable('category_visualisation');
  } catch (error) {
    logger.error(`Error rolling back category_visualisation ${error}`);
  }

  try {
    await query.dropTable('entity_visualisation');
  } catch (error) {
    logger.error(`Error rolling back entity_visualisation ${error}`);
  }

  try {
    await query.dropTable('visualisation');
  } catch (error) {
    logger.error(`Error rolling back visualisation ${error}`);
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
