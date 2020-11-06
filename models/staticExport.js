const { Model, STRING, ENUM, TEXT, INTEGER } = require('sequelize');
const sequelize = require('services/sequelize');

class StaticExport extends Model {}
StaticExport.init({
  id: {
    type: INTEGER,
    primaryKey: true,
    allowNull: false,
    autoIncrement: true
  },
  status: ENUM('in_progress', 'complete', 'error', 'queue'),
  url: STRING(2083),
  error: TEXT
}, { sequelize, modelName: 'staticExport', tableName: 'static_export', createdAt: 'created_at', updatedAt: 'updated_at' });

module.exports = StaticExport;
