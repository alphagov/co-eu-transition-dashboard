const logger = require('services/logger');

const up = async (query) => {
  try {
    await query.sequelize.query("insert into role (name) select concat(name,'_edit') from department;");
  } catch (error) {
    logger.error(`Error migrating ${error}`);
    logger.error(`Rolling back changes`);
    await down(query);
    throw error;
  }
};

const down = async (query) => {
  await query.sequelize.query("delete from role where name like '%_edit';");
};

module.exports = {
  up,
  down
};
