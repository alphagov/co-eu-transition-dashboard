const { Model, STRING, INTEGER, BOOLEAN, ENUM, BLOB } = require('sequelize');
const sequelize = require('services/sequelize');
const modelUtils = require('utils/models');

class MilestoneField extends Model {}
MilestoneField.init({
  name: STRING(45),
  type: ENUM("string", "boolean", "integer", "float", "group"),
  is_active: BOOLEAN
}, { sequelize, modelName: 'milestoneField', tableName: 'milestone_field', timestamps: false });

class MilestoneFieldEntry extends Model {
  get fields() {
    const milestoneField = this.get('milestoneField');
    return {
      id: `milestoneFieldEntry->${milestoneField.id}`,
      name: milestoneField.name,
      value: this.get('value')
    };
  }
}

MilestoneFieldEntry.init({
  milestone_field_id: {
    type: INTEGER,
    primaryKey: true
  },
  milestone_uid: {
    type: STRING(45),
  },
  value: {
    type: BLOB,
    get() {
      let value = this.getDataValue('value').toString('utf8');
      return modelUtils.parseFieldEntryValue(value, this.milestoneField)
    }
  }
}, { sequelize, modelName: 'milestoneFieldEntry', tableName: 'milestone_field_entry', createdAt: 'created_at', updatedAt: 'updated_at' });

MilestoneFieldEntry.belongsTo(MilestoneField, { foreignKey: 'milestone_field_id' });

module.exports = MilestoneFieldEntry;