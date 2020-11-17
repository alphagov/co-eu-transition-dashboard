const { expect, sinon } = require('test/unit/util/chai');
const { paths } = require('config');
const authentication = require('services/authentication');
const { ipWhiteList } = require('middleware/ipWhitelist');
const entityUserPermissions = require('middleware/entityUserPermissions');
const measures = require('helpers/measures');

let page = {};
let res = { locals: {
  entitiesUserCanAccess: ['e1', 'e2']
} };
let req = {};

describe('pages/search-transition-readiness/SearchTransitionReadiness.js', () => {
  beforeEach(() => {
    const ReportingOverview = require('pages/search-transition-readiness/SearchTransitionReadiness.js');

    page = new ReportingOverview('some path', req, res);

    sinon.stub(authentication, 'protect').returns([]);
  });

  afterEach(() => {
    authentication.protect.restore();
  });

  describe('#url', () => {
    it('returns correct url', () => {
      expect(page.url).to.eql(paths.searchTransitionReadiness);
    });
  });

  describe('#middleware', () => {
    it('only viewer, static and devolved_administrations roles can access this page', () => {
      expect(page.middleware).to.eql([
        ipWhiteList,
        ...authentication.protect(['viewer', 'static', 'devolved_administrations']),
        entityUserPermissions.assignEntityIdsUserCanAccessToLocals
      ]);

      sinon.assert.calledWith(authentication.protect, ['viewer', 'static', 'devolved_administrations']);
    });
  });

  describe('#getMeasures', () =>{
    const mockMeasures = [
      {
        id: 600, 
        theme: 'B', 
        name: 'Measure-01',
        link: '/B/st1/Measure-01', 
        color: 'red'
      },  {
        id: 601, 
        theme: 'B', 
        name: 'Measure-02',
        link: '/B/st1/Measure-02', 
        color: 'green'
      }]
    beforeEach(()=>{
      sinon.stub(measures, 'getMeasuresWhichUserHasAccess').resolves(mockMeasures);
    })
    afterEach(()=>{
      measures.getMeasuresWhichUserHasAccess.restore();
    })
    it('returns list of measures', async()=> {
      const measureEntities = await page.getMeasures();
      expect(measureEntities).to.eql(mockMeasures);
      sinon.assert.calledWith(measures.getMeasuresWhichUserHasAccess, ['e1', 'e2'])
    })
  })
});
