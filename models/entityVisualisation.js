const { Model, INTEGER } = require('sequelize');
const sequelize = require('services/sequelize');

class EntityVisualisation extends Model {}
EntityVisualisation.init({
  entityId: {
    type: INTEGER,
    field: "entity_id",
  },
  visualisationId: {
    type: INTEGER,
    field: "visualisation_id",
  },
  config: {
    type: JSON,
  },
  priority: {
    type: INTEGER,
  },
}, { sequelize, modelName: 'entityVisualisation', tableName: 'entity_visualisation', timestamps: false });

module.exports = EntityVisualisation;