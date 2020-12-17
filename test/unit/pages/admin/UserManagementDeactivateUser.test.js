const { expect, sinon } = require('test/unit/util/chai');
const { paths } = require('config');
const authentication = require('services/authentication');
const flash = require('middleware/flash');
const User = require('models/user');
const UserManagementDeactivateUser = require('pages/admin/user-management/deactivate/DeactivateUser');

let page = {};

describe('pages/admin/user-management/deactivate/DeactivateUser', () => {
  beforeEach(() => {
    const res = { cookies: sinon.stub(), redirect: sinon.stub() };
    const req = { cookies: [], params: {}, flash: sinon.stub(), originalUrl: 'some-url' };

    page = new UserManagementDeactivateUser('some path', req, res);

    sinon.stub(authentication, 'protect').returns([]);
  });

  afterEach(() => {
    authentication.protect.restore();
  });

  describe('#url', () => {
    it('returns correct url', () => {
      expect(page.url).to.eql(paths.admin.deactivateUser);
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

  describe('#postRequest', () => {
    let user = {};

    beforeEach(() => {
      user = {
        id: 1,
        save: sinon.stub().resolves()
      };
      page.getUser = sinon.stub().returns(user);
    });

    it('sets isActive to false', async () => {
      await page.postRequest(page.req, page.res);

      sinon.assert.called(page.getUser);
      sinon.assert.called(user.save);
      expect(user.isActive).to.eql(false);

      sinon.assert.calledWith(page.res.redirect, `${page.req.originalUrl}/success`);
    });

    it('redirects to original url if error and sets error to flash', async () => {
      page.getUser.rejects(new Error());

      await page.postRequest(page.req, page.res);

      sinon.assert.calledWith(page.req.flash, "Unable to deactivate user.");
      sinon.assert.calledWith(page.res.redirect, page.req.originalUrl);
    });
  });
});
