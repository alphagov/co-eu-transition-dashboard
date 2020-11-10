const { Model, STRING, INTEGER } = require('sequelize');
const sequelize = require('services/sequelize');

class RoleEntity extends Model {}
RoleEntity.init({
  roleId: {
    type: INTEGER,
    primaryKey: true,
    field: 'role_id'
  },
  entityId: {
    type: INTEGER,
    primaryKey: true,
    field: 'entity_id'
  }
}, { sequelize, modelName: 'roleEntity', tableName: 'role_entity', timestamps: false });

module.exports = RoleEntity;
