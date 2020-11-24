const jwt = require('services/jwt');
const authentication = require('services/authentication');

const restoreUserIfAuthenticated = (req, res, next) => {
  const data = jwt.restoreData(req, res, false);

  authentication.authenticateUser(data, (error, user) => {
    if(user) {
      req.user = user;
    }
    next();
  });
};

module.exports = restoreUserIfAuthenticated;
