const { expect, sinon } = require('test/unit/util/chai');
const { paths } = require('config');
const authentication = require('services/authentication');
const flash = require('middleware/flash');
const User = require('models/user');
const ResetUser2FA = require('pages/admin/user-management/reset-user-2fa/ResetUser2FA');

let page = {};

describe('pages/admin/user-management/rest-user-2fa/UserManagementResetUser2FA', () => {
  beforeEach(() => {
    const res = { cookies: sinon.stub(), redirect: sinon.stub() };
    const req = { cookies: [], params: {}, flash: sinon.stub(), originalUrl: 'some-url' };

    page = new ResetUser2FA('some path', req, res);

    sinon.stub(authentication, 'protect').returns([]);
  });

  afterEach(() => {
    authentication.protect.restore();
  });

  describe('#url', () => {
    it('returns correct url', () => {
      expect(page.url).to.eql(paths.admin.resetUser2FA);
    });
  });

  describe('#pathToBind', () => {
    it('returns correct url', () => {
      expect(page.pathToBind).to.eql(`${paths.admin.resetUser2FA}/:userId/:success(success)?`);
    });
  });

  describe('#successMode', () => {
    it('returns true if in success mode', () => {
      page.req.params = { success: 'success' };

      expect(page.successMode).to.be.ok;
    });

    it('returns false if not in success mode', () => {
      page.req.params = {};

      expect(page.successMode).to.not.be.ok;
    });
  });

  describe('#middleware', () => {
    it('only admins are aloud to access this page', () => {
      expect(page.middleware).to.eql([
        ...authentication.protect(['admin']),
        flash
      ]);

      sinon.assert.calledWith(authentication.protect, ['admin']);
    });
  });

  describe('#getUser', () => {
    it('gets user details', async () => {
      page.req.params.userId = 1;

      await page.getUser();

      sinon.assert.calledWith(User.findOne, {
        where: {
          id: page.req.params.userId
        }
      });
    });
  });

  describe('#resetUser2FA', () => {
    it('should call save on user', async () => {
      page.req.params.userId = 1;
      const user = {
        save: sinon.stub().returns({})
      }

      await page.resetUser2FA(user);

      expect(user.loginAttempts).to.eql(0);
      expect(user.twofaSecret).to.be.null;
      sinon.assert.called(user.save);
    });
  });
  
  describe('#postRequest', () => {
    const user = { email: 'some@email.com', id: 1 };

    beforeEach(() => {
      page.getUser = sinon.stub().returns(user);
      page.resetUser2FA = sinon.stub();
    });

    it('should call correct functions and redirect on success', async () => {
      await page.postRequest(page.req, page.res);

      sinon.assert.called(page.getUser);
      sinon.assert.calledWith(page.resetUser2FA, user,);
      sinon.assert.calledWith(page.res.redirect, `${page.req.originalUrl}/success`);
    });

    it('redirects to original url if error and sets flash', async () => {
      page.getUser.rejects(new Error('error'));

      await page.postRequest(page.req, page.res);

      sinon.assert.calledWith(page.req.flash, 'error');
      sinon.assert.calledWith(page.res.redirect, page.req.originalUrl);
    });
  });
});
