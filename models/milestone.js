const { STRING, DATE, Model } = require('sequelize');
const sequelize = require('services/sequelize');
const modelUtils = require('helpers/models');
const MilestoneFieldEntry = require('./milestoneFieldEntry');

class Milestone extends Model {
  static includes(attributeKey) {
    return Object.keys(this.rawAttributes).includes(attributeKey);
  }

  static createSearch(attributeKey, options) {
    return modelUtils.createFilterOptions(attributeKey, options);
  }

  get fields() {
    const fields = modelUtils.transformForView(this);

    if(this.get('milestoneFieldEntries')){
      this.get('milestoneFieldEntries').forEach(field => {
        fields.push(field.fields);
      });
    }

    return fields;
  }
}

Milestone.init({
  uid: {
    type: STRING(32),
    primaryKey: true,
    displayName: 'Milestone UID'
  },
  projectUid: {
    type: STRING(32),
    field: "project_uid"
  },
  description: {
    type: STRING,
    allowNull: false,
    displayName: 'Milestone Description'
  },
  date: {
    type: DATE,
    allowNull: false,
    displayName: 'Due Date'
  }
}, { sequelize, modelName: 'milestone', tableName: 'milestone', createdAt: 'created_at', updatedAt: 'updated_at' });

Milestone.hasMany(MilestoneFieldEntry, { foreignKey: 'milestoneUid' });

module.exports = Milestone;
