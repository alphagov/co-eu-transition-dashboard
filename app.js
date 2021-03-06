const express = require('express');
const nunjucks = require('middleware/nunjucks');
const pages = require('./pages');
const bodyParser = require('body-parser');
const logger = require('middleware/logger');
const helmet = require('middleware/helmet');
const cookieParser = require('cookie-parser');
const config = require('config');
const startPage = require('helpers/startPage');
const cache = require('middleware/cache');
const path = require('path');
const PageNotFound = require('pages/page-not-found/PageNotFound');
const pageNotFound = new PageNotFound(path.resolve('pages/page-not-found'));
const httpContext = require('express-http-context');
require('./notifications');

const app = module.exports = express();

// May need to specify an IP here
app.set('trust proxy', true);

helmet.attach(app);

app.use(bodyParser.urlencoded({ extended: true, parameterLimit: 5000 }));
app.use(cookieParser());

app.use(httpContext.middleware);
app.use((req, res, next) => {
  httpContext.set('req', req)
  next();
});

nunjucks.attach(app);

if (config.env === 'development') {
  const webpack = require('middleware/webpack');
  webpack.configure(app);
} else {
  app.use('/assets', express.static('dist'));
}

app.use('/common', express.static('common'));

logger.attachRouteLogger(app);

cache.preventCache(app);
pages.attach(app);
app.get('/', (req, res) => res.redirect(startPage()));
app.use(pageNotFound.router);

logger.attachErrorLogger(app);
