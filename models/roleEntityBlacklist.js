const { Model, INTEGER } = require('sequelize');
const sequelize = require('services/sequelize');

class RoleEntityBlacklist extends Model {}
RoleEntityBlacklist.init({
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
}, { sequelize, modelName: 'roleEntityBlacklist', tableName: 'role_entity_blacklist', timestamps: false });

module.exports = RoleEntityBlacklist;
