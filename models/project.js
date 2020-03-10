const { Model, STRING, INTEGER, BOOLEAN, TEXT } = require('sequelize');
const sequelize = require('services/sequelize');
const Milestone = require('./milestone');
const ProjectFieldEntry = require('./projectFieldEntry');
const modelUtils = require('utils/models');

class Project extends Model {
  get fields() {
    const fields = modelUtils.transformForView(this);

    this.get('projectFieldEntries').forEach(field => {
      fields.push(field.fields);
    });

    return fields;
  }
}

Project.init({
  uid: {
    type: STRING(45),
    primaryKey: true,
    displayName: 'ID',
  },
  department_name: {
    type: STRING(10),
    displayName: 'Department',
    allowNull: false,
    showCount: true
  },
  issue: {
    type: STRING(1024),
    displayName: 'Issue',
  },
  impact: {
    type: INTEGER,
    displayName: 'Impact',
  },
  is_completed: {
    type: BOOLEAN,
    displayName: 'Status'
  },
  sro: {
    type: STRING(256),
    displayName: 'SRO'
  },
  description: {
    type: TEXT,
    displayName: 'Description'
  }
}, { sequelize, modelName: 'project', tableName: 'project', createdAt: 'created_at', updatedAt: 'updated_at' });

Project.hasMany(Milestone, { foreignKey: 'project_uid' });
Project.hasMany(ProjectFieldEntry, { foreignKey: 'project_uid' });

module.exports = Project;