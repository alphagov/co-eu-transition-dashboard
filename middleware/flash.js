const jwt = require('services/jwt');

const flash = (req, res, next) => {
  const data = jwt.restoreData(req);

  if (data.flash) {
    res.locals = res.locals || {};
    res.locals.flash = data.flash;
    jwt.saveData(req, res, { flash: undefined });
  }

  req.flash = (message, restoreData) => {
    return jwt.saveData(req, res, { flash: message }, restoreData);
  };

  next();
};

module.exports = flash;