const logger = require('services/logger');
const Sequelize = require('sequelize');


const up = async (query) => {
  try {
    await query.addColumn(
      'role_entity',
      'can_edit',
      {
        type: Sequelize.DataTypes.BOOLEAN,
      }
    );
    await query.addColumn(
      'role_entity',
      'should_cascade',
      {
        type: Sequelize.DataTypes.BOOLEAN,
      }
    );
  } catch (error) {
    logger.error(`Error migrating ${error}`);
    logger.error(`Rolling back changes`);
    await down(query);
    throw error;
  }
};

const down = async (query) => {
  await query.removeColumn('role_entity', 'can_edit');
  await query.removeColumn('role_entity', 'should_cascade');
};

module.exports = {
  up,
  down
};
