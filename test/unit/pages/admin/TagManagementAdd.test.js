const { expect, sinon } = require('test/unit/util/chai');
const { paths } = require('config');
const authentication = require('services/authentication');
const flash = require('middleware/flash');
const tags = require('helpers/tags');

let page = {};

describe('pages/admin/tag-management/add/AddTag', () => {
  beforeEach(() => {
    const AddTagPage = require('pages/admin/tag-management/add/AddTag');

    const res = { cookies: sinon.stub(), redirect: sinon.stub() };
    const req = { cookies: [], params: {}, flash: sinon.stub(), originalUrl: 'some-url' };

    page = new AddTagPage('some path', req, res);

    sinon.stub(authentication, 'protect').returns([]);
  });

  afterEach(() => {
    authentication.protect.restore();
  });

  describe('#url', () => {
    it('returns correct url', () => {
      expect(page.url).to.eql(paths.admin.tagManagementAdd);
    });
  });

  describe('#middleware', () => {
    it('only admins are aloud to access this page', () => {
      expect(page.middleware).to.eql([
        ...authentication.protect(['admin']), flash
      ]);

      sinon.assert.calledWith(authentication.protect, ['admin']);
    });
  });

  describe('#postRequest', () => {
    const mockTagName = 'mock tag';
    
    afterEach(() => {
    });

    it('creates new tag', async () => {
      sinon.stub(tags,'createTag').returns({ name:mockTagName });

      page.req.body = { tagName: mockTagName }
      await page.postRequest(page.req, page.res);
        
      sinon.assert.calledWith(tags.createTag, mockTagName);
    
      sinon.assert.calledWith(page.res.redirect, `${page.req.originalUrl}/success`);
    });
    
    it('redirects to original url if error and sets error to flash', async () => {
      const err = new Error('DUPLICATE_TAG');
      tags.createTag = sinon.stub().throws(err);
      page.req.body = { tagName: mockTagName }
      const expectedErrors = [{ text:'Similar tag exists, give a different name', href: '#tagName' }];

      await page.postRequest(page.req, page.res);
    
      sinon.assert.calledWith(page.req.flash, expectedErrors);
      sinon.assert.calledWith(page.res.redirect, page.req.originalUrl);
    });
  });
});
