const restoreUserIfAuthenticated = require('middleware/restoreUserIfAuthenticated');
const jwt = require('services/jwt');
const authentication = require('services/authentication');
const { expect, sinon } = require('test/unit/util/chai');

let next;
let req;
let res;

describe('middleware/restoreUserIfAuthenticated', () => {
  beforeEach(() => {
    sinon.stub(jwt, 'restoreData');
    sinon.stub(authentication, 'authenticateUser');

    req = {};
    res = {};
    next = sinon.stub();
  });

  afterEach(() => {
    jwt.restoreData.restore();
    authentication.authenticateUser.restore();
  });

  it('attaches user to req if authenticated', () => {
    const user = { id: 1 };
    authentication.authenticateUser.callsArgWith(1, null, user);

    restoreUserIfAuthenticated(req, res, next);

    expect(req.user).to.eql(user);

    sinon.assert.calledOnce(next);
    sinon.assert.calledWith(jwt.restoreData, req, res, false);
  });

  it('no user attached if user is not authed', () => {
    const error = new Error('Not authed');
    authentication.authenticateUser.callsArgWith(1, error);

    restoreUserIfAuthenticated(req, res, next);

    expect(req.user).to.be.undefined;

    sinon.assert.calledOnce(next);
    sinon.assert.calledWith(jwt.restoreData, req, res, false);
  });
});
