const { sinon } = require('test/unit/util/chai');
const Sequelize = require('sequelize');
const { services } = require('config');

describe('services/sequelize', () => {
  before(() => {
    require('services/sequelize');
  });

  it('should create a Sequelize instance', () => {
    sinon.assert.calledWith(Sequelize, services.mysql.uri, {
      dialect: 'mysql',
      define: {
        charset: services.mysql.charset
      },
      dialectOptions: {
        ssl: null
      },
      logging: services.mysql.logsActive,
      pool: {
        max: 5,
        min: 1,
        acquire: 30000,
        idle: 10000
      }
    });
  });
});
