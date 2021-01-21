const logger = require('services/logger');

const up = async (query) => {
  try {
    await query.sequelize.query("INSERT INTO user_role(user_id, role_id) SELECT u.user_id, r.id FROM department_user AS u, role AS r WHERE concat(u.department_name,'_edit') = r.name");
  } catch (error) {
    logger.error(`Error migrating ${error}`);
    logger.error(`Rolling back changes`);
    await down(query);
    throw error;
  }
};

const down = async (query) => {
  await query.sequelize.query("DELETE FROM user_role WHERE role_id IN (SELECT id FROM role WHERE name LIKE '%_edit')");
};

module.exports = {
  up,
  down
};
