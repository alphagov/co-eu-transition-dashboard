const { Model, STRING, INTEGER, BOOLEAN, ENUM, BLOB } = require('sequelize');
const sequelize = require('services/sequelize');
const modelUtils = require('utils/models');

class ProjectField extends Model {}
ProjectField.init({
  name: STRING(45),
  type: ENUM("string", "boolean", "integer", "float", "group"),
  is_active: BOOLEAN
}, { sequelize, modelName: 'projectField', tableName: 'project_field', timestamps: false });

class ProjectFieldEntry extends Model {
  get fields() {
    const projectField = this.get('projectField');
    return {
      id: JSON.stringify({
        path: 'projects->ProjectFieldEntryFilter',
        id: this.get('id')
      }),
      name: projectField.name,
      value: modelUtils.parseFieldEntryValue(this.get('value'), projectField)
    };
  }
}

ProjectFieldEntry.init({
  id: {
    type: INTEGER,
    primaryKey: true
  },
  project_field_id: {
    type: INTEGER
  },
  project_uid: {
    type: STRING(45),
  },
  value: {
    type: BLOB,
    get() {
      let value = this.getDataValue('value').toString('utf8');
      return modelUtils.parseFieldEntryValue(value, this.projectField)
    }
  }
}, { sequelize, modelName: 'projectFieldEntry', tableName: 'project_field_entry', createdAt: 'created_at', updatedAt: 'updated_at' });

ProjectFieldEntry.belongsTo(ProjectField, { foreignKey: 'project_field_id' });
ProjectField.hasMany(ProjectFieldEntry, { foreignKey: 'project_field_id' });

module.exports = ProjectFieldEntry;