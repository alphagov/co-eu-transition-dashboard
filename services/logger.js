const winston = require('winston');
const httpContext = require('express-http-context');
const set = require('lodash/set');
const config = require('config');

const addMeta = winston.format(info => {
  const req = httpContext.get('req') || {};
  if(req.headers && config.services.logger.includeMeta) {
    set(info, 'meta.req.headers', req.headers);
  }

  if(req.user) {
    info.userId = req.user.id;
  }

  if(config.services.logger.includeMeta) {
    info.originalMessage = info.message;
  }

  return info;
});

const loggerConfig = {
  transports: [
    new winston.transports.Console()
  ],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    addMeta(),
    winston.format[config.services.logger.format]()
  )
};

const logger = winston.createLogger(loggerConfig);

module.exports = logger;
