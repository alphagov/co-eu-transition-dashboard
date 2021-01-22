const { Model, STRING, INTEGER } = require('sequelize');
const sequelize = require('services/sequelize');

class Visualisation extends Model {}
Visualisation.init({
  id: {
    type: INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: STRING(45),
    allowNull: false,
    unique: true
  },
  template: {
    type: STRING(255),
    allowNull: true,
  }
}, { sequelize, modelName: 'visualisation', tableName: 'visualisation', timestamps: false });


module.exports = Visualisation;
