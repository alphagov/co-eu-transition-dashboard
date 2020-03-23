const { Model, STRING, BOOLEAN, ENUM, JSON } = require('sequelize');
const sequelize = require('services/sequelize');

class MilestoneField extends Model {}
MilestoneField.init({
  name: STRING(45),
  type: ENUM("string", "boolean", "integer", "float", "group"),
  config: JSON,
  is_active: BOOLEAN,
  displayName: {
    type: STRING(300),
  }
}, { sequelize, modelName: 'milestoneField', tableName: 'milestone_field', timestamps: false });

module.exports = MilestoneField;