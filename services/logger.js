const winston = require('winston');
const httpContext = require('express-http-context');

const addMeta = winston.format(info => {
  const req = httpContext.get('req') || {};
  if(req.headers) {
    Object.keys(req.headers).forEach(headerName => {
      info[headerName] = req.headers[headerName];
    });
  }
  if(req.user) {
    info.userId = req.user.id;
  }

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
