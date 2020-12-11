const { services } = require('config');
const Sequelize = require('sequelize');
const logger = require('services/logger');
const Umzug = require('umzug');
const path = require('path');
const config = require('config');

// Something in cloudfoundry is replacing mysql:// with mysql2:// which is causing some issues
const sequelize = new Sequelize(services.mysql.uri.replace(/^mysql2:\/\//,'mysql://'),{
  dialect: 'mysql',
  define: {
    charset: services.mysql.charset
  },
  dialectOptions: {
    ssl: services.mysql.sslCertificate
  },
  logging: config.services.mysql.logsActive,
  pool: {
    max: 5,
    min: 1,
    acquire: 30000,
    idle: 10000
  }
});

const umzug = new Umzug({
  migrations: {
    path: path.join(__dirname, '../migrations'),
    params: [ sequelize.getQueryInterface() ]
  },
  storage: 'sequelize',
  storageOptions: { sequelize },
  logging: message => logger.info(message)
});

sequelize.runMigrations = async () => {
  try {
    return await umzug.up();
  } catch (error) {
    return error;
  }
};

sequelize.testConnection = async () => {
  try{
    await sequelize.authenticate();
  } catch(error) {
    logger.error(error);
    throw error;
  }
};

module.exports = sequelize;
