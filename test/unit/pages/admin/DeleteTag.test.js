const { expect, sinon } = require('test/unit/util/chai');
const { paths } = require('config');
const authentication = require('services/authentication');
const flash = require('middleware/flash');
const Tag = require('models/tag');
const Entity = require('models/entity');
const EntityFieldEntry = require('models/entityFieldEntry');
const CategoryField = require('models/categoryField');
const config = require('config');

let page = {};

describe('pages/admin/tag-management/delete/DeleteTag', () => {
  beforeEach(() => {
    const DeleteTag = require('pages/admin/tag-management/delete/DeleteTag');

    const res = { cookies: sinon.stub(), redirect: sinon.stub() };
    const req = { cookies: [], params: {}, flash: sinon.stub() };

    page = new DeleteTag('some path', req, res);

    sinon.stub(authentication, 'protect').returns([]);
  });

  afterEach(() => {
    authentication.protect.restore();
  });

  describe('#url', () => {
    it('returns correct url', () => {
      expect(page.url).to.eql(paths.admin.tagManagementDelete);
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

  describe('#getTag', () => {
    beforeEach(() => {
      Tag.findOne.returns({
        id: 1,
        name: 'some-tag',
        entities: [{
          entityFieldEntries: [{
            categoryField: { name: 'name' },
            value: 'some name'
          }]
        }]
      });
    });

    it('gets tag and mapps entity fields', async () => {
      page.req.params.tagId = 1;

      const tag = await page.getTag();

      expect(tag).to.eql({
        id: 1,
        name: 'some-tag',
        entities: [{
          name: 'some name'
        }]
      });

      sinon.assert.calledWith(Tag.findOne, {
        where: {
          id: page.req.params.tagId
        },
        include: {
          model: Entity,
          include: {
            model: EntityFieldEntry,
            include: CategoryField
          }
        }
      });
    });
  });

  describe('#deleteTag', () => {
    it('deletes tag', async () => {
      page.req.params.tagId = 1;

      await page.deleteTag();

      sinon.assert.calledWith(Tag.destroy, {
        where: {
          id: page.req.params.tagId
        }
      });
    });
  });

  describe('#postRequest', () => {
    beforeEach(() => {
      sinon.stub(page, 'deleteTag')
    });

    afterEach(() => {
      page.deleteTag.restore();
    });

    it('should call deleteTag and redirect to tags list', async () => {
      page.req.originalUrl = 'someurl';
      await page.postRequest(page.req, page.res);

      sinon.assert.calledOnce(page.deleteTag);
      sinon.assert.calledWith(page.res.redirect, config.paths.admin.tagManagementList);
    });

    it('should call deleteTag and redirect back to delete page when an error occurs', async () => {
      page.req.originalUrl = 'someurl';

      page.deleteTag.throws('error')

      await page.postRequest(page.req, page.res);

      sinon.assert.calledOnce(page.deleteTag);
      sinon.assert.calledWith(page.req.flash, "An error occoured when deleting the tag.");
      sinon.assert.calledWith(page.res.redirect, page.req.originalUrl);
    });
  });
});
