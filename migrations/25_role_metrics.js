const { services } = require('config');
const logger = require('services/logger');
const Sequelize = require('sequelize');

const up = async (query) => {
  await query.createTable('role_entity', {
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
    role_id: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'role',
        key: 'id'
      },
      onUpdate: 'cascade',
      onDelete: 'cascade'
    }
  }, { charset: services.mysql.charset });

  await query.addConstraint('role_entity', ['role_id', 'entity_id'], {
    type: 'primary key',
    name: 'pk_role_entity'
  });

  await query.createTable('role_entity_blacklist', {
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
    role_id: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'role',
        key: 'id'
      },
      onUpdate: 'cascade',
      onDelete: 'cascade'
    }
  }, { charset: services.mysql.charset });

  await query.addConstraint('role_entity_blacklist', ['role_id', 'entity_id'], {
    type: 'primary key',
    name: 'pk_role_entity_blacklist'
  });

};

const down = async (query) => {
  try {
    await query.dropTable('role_entity');
  } catch (error) {
    logger.error(`Error rolling back role_entity ${error}`);
  }

  try {
    await query.dropTable('role_entity_blacklist');
  } catch (error) {
    logger.error(`Error rolling back role_entity_blacklist ${error}`);
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
