const winston = require('winston');

const format = winston.format.printf(info => {
  let messageAsString = `${info.timestamp} ${info.level}:`;

  if(info.headers) {
    Object.keys(info.headers).forEach(headerName => {
      messageAsString += ` ${headerName}: ${info.headers[headerName]}`;
    });
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

