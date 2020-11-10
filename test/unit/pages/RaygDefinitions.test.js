const { expect, sinon } = require('test/unit/util/chai');
const { paths } = require('config');
const authentication = require('services/authentication');
const jwt = require('services/jwt');
const { ipWhiteList } = require('middleware/ipWhitelist');

let page = {};
let res = {};
let req = {};

describe('pages/rayg-definitions/RaygDefinitions', () => {
  beforeEach(() => {
    const RaygDefinitions = require('pages/rayg-definitions/RaygDefinitions');

    page = new RaygDefinitions('some path', req, res);

    sinon.stub(jwt, 'restoreData');

    sinon.stub(authentication, 'protect').returns([]);
  });

  afterEach(() => {
    jwt.restoreData.restore();
    authentication.protect.restore();
  });

  describe('#url', () => {
    it('returns correct url', () => {
      expect(page.url).to.eql(paths.raygDefinitions);
    });
  });

  describe('#middleware', () => {
    it('only viewer and static roles can access this page', () => {
      expect(page.middleware).to.eql([
        ipWhiteList,
        ...authentication.protect(['viewer', 'static', 'devolved_administrations'])
      ]);

      sinon.assert.calledWith(authentication.protect, ['viewer', 'static', 'devolved_administrations']);
    });
  });
});
