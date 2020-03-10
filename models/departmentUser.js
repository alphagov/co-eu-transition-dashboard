const { Model, STRING, ENUM, DATE, INTEGER } = require('sequelize');
const sequelize = require('services/sequelize');
const Department = require('models/department');
const User = require('models/user');

class DepartmentUser extends Model {}
DepartmentUser.init({
  department_name: {
    type: STRING(10),
    primaryKey: true
  },
  user_id: INTEGER
}, { sequelize, modelName: 'departmentUser', tableName: 'department_user', timestamps: false });

module.exports = DepartmentUser;