const { Model, INTEGER } = require('sequelize');
const sequelize = require('services/sequelize');

class CategoryVisualisation extends Model {}
CategoryVisualisation.init({
  categoryId: {
    type: INTEGER,
    field: "category_id",
  },
  visualisationId: {
    type: INTEGER,
    field: "visualisation_id",
  },
  config: {
    type: JSON,
  },
}, { sequelize, modelName: 'categoryVisualisation', tableName: 'category_visualisation', timestamps: false });

module.exports = CategoryVisualisation;