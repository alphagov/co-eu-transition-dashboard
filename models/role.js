const { Model, INTEGER, STRING } = require('sequelize');
const sequelize = require('services/sequelize');
const RoleEntity = require('./roleEntity');
const RoleEntityBlacklist = require('./roleEntityBlacklist');
const UserRole = require('./userRole');

class Role extends Model {}
Role.init({
  id: {
    type: INTEGER,
    primaryKey: true
  },
  name: {
    type: STRING(45)
  }
}, { sequelize, modelName: 'role', tableName: 'role', timestamps: false });

Role.hasMany(RoleEntity, { foreignKey: 'roleId' });
Role.hasMany(RoleEntityBlacklist, { foreignKey: 'roleId' });

Role.hasMany(UserRole, { foreignKey: 'roleId' });

module.exports = Role;
