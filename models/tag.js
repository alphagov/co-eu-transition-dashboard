const { Model, STRING, ENUM, TEXT, INTEGER } = require('sequelize');
const sequelize = require('services/sequelize');

class Tag extends Model {}
Tag.init({
  id: {
    type: INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: STRING(45),
    allowNull: true,
    unique: true
  }
}, { sequelize, modelName: 'tag', tableName: 'tag', timestamps: false });

module.exports = Tag;
