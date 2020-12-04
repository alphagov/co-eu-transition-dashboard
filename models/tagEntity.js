const { Model, INTEGER } = require('sequelize');
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
}, { sequelize, modelName: 'tagEntity', tableName: 'tag_entity', timestamps: false });

module.exports = TagEntity;
