const winston = require('winston');
var httpContext = require('express-http-context');

const format = winston.format.printf(info => {
  const req = httpContext.get('req') || {};
  let messageAsString = `${info.timestamp} ${info.level}:`;

  if(req.headers) {
    Object.keys(req.headers).forEach(headerName => {
      messageAsString += ` ${headerName}: ${req.headers[headerName]}`;
    });
  }

  if(req.user) {
    messageAsString += ` User ID: ${req.user.id}`;
  }

  messageAsString += ` ${info.message}`;

  if (info && info instanceof Error) {
    messageAsString += ` Stack Trace: ${info.stack}`;
  }

  return messageAsString;
});

const config = {
  transports: [
    new winston.transports.Console()
  ],
  format: winston.format.combine(
    winston.format.splat(),
    winston.format.timestamp(),
    winston.format.colorize(),
    format
  )
};

const logger = winston.createLogger(config);

module.exports = logger;
