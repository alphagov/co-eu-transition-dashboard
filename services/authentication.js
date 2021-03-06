const passport = require('passport');
const jwt = require('services/jwt');
const config = require('config');
const bcrypt = require('bcrypt');
const User = require('models/user');
const Department = require('models/department');
const Role = require('models/role');
const { Strategy: passportLocalStrategy } = require('passport-local');
const { Strategy: passportJWTStrategy } = require("passport-jwt");
const speakeasy = require('speakeasy');
const sequelize = require('services/sequelize');
const { Op } = require('sequelize');
const get = require('lodash/get');

const hashPassphrase = passphrase => {
  try {
    return bcrypt.hash(passphrase,config.bcrypt.saltRounds);
  } catch(err) {
    throw Error(`Bcrypt error: ${err}`);
  }
};

const authenticateLogin = async (email, password, done) => {
  const user = await User.findOne({
    where: {
      email,
      isActive: true
    },
    include: Role
  });

  if(!user) {
    const error = new Error('No user found');
    return done(error);
  }

  if(user.loginAttempts >= config.users.maximumLoginAttempts) {
    const error = new Error('Maximum login attempts exeeded');
    error.maximumLoginAttempts = true;
    return done(error);
  }

  const passwordMatches = await bcrypt.compare(password, user.hashedPassphrase);
  if (!passwordMatches) {
    await user.increment("loginAttempts");
    const error = new Error('Password doest not match');
    return done(error);
  }

  await user.update({ loginAttempts: 0, lastLoginAt: sequelize.fn('NOW') });
  done(null, user);
};

const localStrategy = new passportLocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, authenticateLogin);
passport.use(localStrategy);

const authenticateUser = (jwtPayload = {}, cb) => {
  if (!jwtPayload.id) {
    return cb(null, false, 'User not authenticated');
  }

  return User.findOne({
    where: {
      id: jwtPayload.id,
      loginAttempts: { [Op.lte]: config.users.maximumLoginAttempts },
      isActive: true
    },
    include: [{
      model: Department
    },{
      model: Role
    }]
  })
    .then(user => {
      cb(null, user);
    })
    .catch(cb);
};
const jwtStrategy = new passportJWTStrategy({
  jwtFromRequest: jwt.token,
  secretOrKey: config.cookie.secret
}, authenticateUser);
passport.use(jwtStrategy);

const protect = (roles = []) => {
  const auth = (req, res, next) => {
    if (get(res, 'locals.tableauIpWhiteList', false)){
      return next()
    }
    return passport.authenticate('jwt', {
      session: false,
      failureRedirect: config.paths.authentication.login,
    })(req, res, next);
  };

  const check2fa = (req, res, next) => {
    if(!config.features.twoFactorAuth) {
      return next();
    }

    const data = jwt.restoreData(req, res) || {};
    const tableauSkip2FA = get(res, 'locals.tableauIpWhiteList', false);
    const userSkip2FA = req.user && req.user.skip2FA && get(res, 'locals.ipWhiteList', false);

    if(!data.tfa && !tableauSkip2FA && !userSkip2FA) {
      return res.redirect(config.paths.authentication.login);
    }
    return next();
  };

  const checkRole = (req, res, next) => {
    if (get(res, 'locals.tableauIpWhiteList', false) || (req.user.skip2FA && get(res, 'locals.ipWhiteList', false))) {
      return next();
    }

    if(!req.user) {
      return res.redirect(config.paths.authentication.login);
    }

    if ((req.user && roles.length == 0) || (req.user.roles.filter(role =>
      roles.includes(role.name)).length > 0)) {
      return next();
    }

    return res.redirect(config.paths.authentication.login)
  };

  const updateCookieExpiration = (req, res, next) => {
    const tableauIpWhiteList = get(res, 'locals.tableauIpWhiteList', false)
    if (!tableauIpWhiteList) {
      jwt.saveData(req, res);
    }
    next();
  };

  return [auth, check2fa, checkRole, updateCookieExpiration];
};

const protectNo2FA = passport.authenticate('jwt', {
  session: false,
  failureRedirect: config.paths.authentication.login
});

const login = (req, res, callback) => {
  return passport.authenticate('local', {
    session: false,
    failureRedirect: config.paths.authentication.login
  }, callback)(req, res);
};

const verify2FA = (secret, token) => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token
  });
};

module.exports = {
  login,
  protect,
  authenticateLogin,
  authenticateUser,
  protectNo2FA,
  verify2FA,
  hashPassphrase
};
