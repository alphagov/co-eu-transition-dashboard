const { expect, sinon } = require('test/unit/util/chai');
const { paths } = require('config');
const authentication = require('services/authentication');
const flash = require('middleware/flash');
const Tag = require('models/tag');

let page = {};

describe('pages/admin/tag-management/list/TagManagementList', () => {
  beforeEach(() => {
    const TagManagementList = require('pages/admin/tag-management/list/TagManagementList');

    const res = { cookies: sinon.stub() };
    const req = { cookies: [] };

    page = new TagManagementList('some path', req, res);

    sinon.stub(authentication, 'protect').returns([]);
  });

  afterEach(() => {
    authentication.protect.restore();
  });

  describe('#url', () => {
    it('returns correct url', () => {
      expect(page.url).to.eql(paths.admin.tagManagementList);
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

  describe('#getTags', () => {
    it('gets tags', async () => {
      await page.getTags();

      sinon.assert.calledWith(Tag.findAll);
    });
  });
});
