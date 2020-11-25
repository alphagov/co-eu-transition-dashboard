const { expect, sinon } = require('test/unit/util/chai');
const { paths } = require('config');
const authentication = require('services/authentication');
const { ipWhiteList } = require('middleware/ipWhitelist');
const entityUserPermissions = require('middleware/entityUserPermissions');
const sequelize = require('services/sequelize');

let page = {};
let res = {};
let req = {};

describe('pages/readiness-overview/ReadinessOverview', () => {
  beforeEach(() => {
    const ReportingOverview = require('pages/readiness-overview/ReadinessOverview');

    page = new ReportingOverview('some path', req, res);

    sinon.stub(authentication, 'protect').returns([]);
  });

  afterEach(() => {
    authentication.protect.restore();
  });

  describe('#url', () => {
    it('returns correct url', () => {
      expect(page.url).to.eql(paths.readinessOverview);
    });
  });

  describe('#middleware', () => {
    it('only viewer and static roles can access this page', () => {
      expect(page.middleware).to.eql([
        ipWhiteList,
        ...authentication.protect(['viewer', 'static']),
        entityUserPermissions.assignEntityIdsUserCanAccessToLocals
      ]);

      sinon.assert.calledWith(authentication.protect, ['viewer', 'static']);
    });
  });

  describe('#getLastUpdatedAt', () => {
    beforeEach(() => {
      sequelize.query.resolves([[{ updated_at: '2020-11-11 11:52:06' }]]);
    });

    it('calls sequelize.query with correct query and returns date', async () => {
      const date = await page.getLastUpdatedAt();
      expect(date).to.eql('Wednesday, November 11th 2020, 11:52am');

      sinon.assert.calledWith(sequelize.query, `
      SELECT MAX(updated_at) AS updated_at
      FROM entity`);
    });
  });
});
