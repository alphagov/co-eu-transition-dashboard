const { Model, STRING, ENUM, TEXT, INTEGER } = require('sequelize');
const sequelize = require('services/sequelize');

class TagEntity extends Model {}
TagEntity.init({
  entityId: {
    type: INTEGER,
    field: "entity_id",
  },
  tagId: {
    type: INTEGER,
    field: "tag_id",
  }
}, { sequelize, modelName: 'tag', tableName: 'tag', timestamps: false });

module.exports = TagEntity;
