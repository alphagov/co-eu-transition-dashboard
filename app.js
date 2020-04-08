const express = require('express');
const nunjucks = require('middleware/nunjucks');
const pages = require('./pages');
const bodyParser = require('body-parser');
const logger = require('middleware/logger');
const helmet = require('middleware/helmet');
const cookieParser = require('cookie-parser');
const config = require('config');

const app = module.exports = express();

helmet.attach(app);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

nunjucks.attach(app);

if (config.env === 'development') {
  const webpack = require('middleware/webpack');
  webpack.configure(app);
} else {
  app.use('/assets', express.static('dist'));
}

logger.attachRouteLogger(app);

pages.attach(app);
app.get('/', (req, res) => res.redirect(config.paths.start));

logger.attachErrorLogger(app);
