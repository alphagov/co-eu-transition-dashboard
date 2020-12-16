const { services } = require('config');
const Sequelize = require('sequelize');
const logger = require('services/logger');
const Umzug = require('umzug');
const path = require('path');

// Something in cloudfoundry is replacing mysql:// with mysql2:// which is causing some issues

let sequelize;

if (services.mysql.socket) {
  sequelize = new Sequelize(services.mysql.database,services.mysql.user,services.mysql.password,{
    dialect: 'mysql',
    define: {
      charset: services.mysql.charset
    },
    dialectOptions: {
      socketPath: services.mysql.socket,
    },
    logging: false
  });
} else if (services.mysql.uri) {
  sequelize = new Sequelize(services.mysql.uri.replace(/^mysql2:\/\//,'mysql://'),{
    dialect: 'mysql',
    define: {
      charset: services.mysql.charset
    },
    dialectOptions: {
      socketPath: services.mysql.socket,
      ssl: services.mysql.sslCertificate
    },
    logging: false
  });
} else {
  throw "Could not find mysql config";
}

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
