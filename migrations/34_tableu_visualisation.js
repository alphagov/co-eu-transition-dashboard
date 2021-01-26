const logger = require('services/logger');

const up = async (query) => {
  try {
    await query.sequelize.query("INSERT INTO visualisation(name, template) VALUES ('Tableau', 'tableau')");
    await query.sequelize.query("INSERT INTO category_visualisation(category_id, visualisation_id) SELECT c.id, v.id FROM category AS c, visualisation AS v WHERE c.name = 'Measure' AND v.name = 'Tableau'");
  } catch (error) {
    logger.error(`Error migrating ${error}`);
    logger.error(`Rolling back changes`);
    await down(query);
    throw error;
  }
};

const down = async (query) => {
  await query.sequelize.query("DELETE FROM category_visualisation WHERE visualisation_id IN (SELECT id FROM visualisation WHERE name = 'Tableau')");
  await query.sequelize.query("DELETE FROM visualisation WHERE name = 'Tableau'");
};

module.exports = {
  up,
  down
};
