const { STRING, DATE, Model } = require('sequelize');
const sequelize = require('services/sequelize');
const modelUtils = require('utils/models');

class Milestone extends Model {
  get fields() {
    return modelUtils.transformForView(this);
  }
}

Milestone.init({
  uid: {
    type: STRING(32),
    primaryKey: true,
    displayName: 'ID'
  },
  project_uid: {
    type: STRING(32)
  },
  description: {
    type: STRING,
    allowNull: false,
    displayName: 'Description'
  },
  date: {
    type: DATE,
    allowNull: false,
    displayName: 'Date'
  }
}, { sequelize, modelName: 'milestone', tableName: 'milestone', createdAt: 'created_at', updatedAt: 'updated_at' });

module.exports = Milestone;