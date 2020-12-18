const winston = require('winston');
const httpContext = require('express-http-context');
const set = require('lodash/set');

const addMeta = winston.format(info => {
  const req = httpContext.get('req') || {};
  if(req.headers) {
    set(info, 'meta.req.headers', req.headers);
  }

  if(req.user) {
    info.userId = req.user.id;
  }

  info.originalMessage = info.message;

  return info;
});

const config = {
  transports: [
    new winston.transports.Console()
  ],
  format: winston.format.combine(
    winston.format.timestamp(),
    addMeta(),
    winston.format.json()
  )
};

const logger = winston.createLogger(config);

module.exports = logger;
