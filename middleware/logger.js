const winstonInstance = require('services/logger');
const expressWinston = require('express-winston');
const config = require('config');

const routeLogger = expressWinston.logger({
  winstonInstance,
  meta: config.services.logger.includeMeta
});
const attachRouteLogger = app => app.use(routeLogger);

const errorLogger = expressWinston.errorLogger({ winstonInstance });
const attachErrorLogger = app => app.use(errorLogger);

module.exports = {
  attachRouteLogger,
  attachErrorLogger
};
