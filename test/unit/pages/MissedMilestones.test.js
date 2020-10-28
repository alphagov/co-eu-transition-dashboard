const { expect, sinon } = require('test/unit/util/chai');
const { paths } = require('config');
const MissedMilestones = require('pages/missed-milestones/MissedMilestones');
const Milestone = require('models/milestone');
const Project = require('models/project');
const config = require('config');
const moment = require('moment');
const authentication = require('services/authentication');

let page = {};
let res = {};
let req = {};

describe('pages/missed-milestones/MissedMilestones', () => {
  beforeEach(() => {
    res = { cookies: sinon.stub() };
    req = { cookies: [], user: { getDepartmentsWithProjects: sinon.stub() } };

    page = new MissedMilestones('some path', req, res);

    sinon.stub(authentication, 'protect').returns([]);
  });

  afterEach(() => {
    authentication.protect.restore();
  });

  describe('#url', () => {
    it('returns correct url', () => {
      expect(page.url).to.eql(paths.missedMilestones);
    });
  });

  describe('#isEnabled', () => {
    let sandbox = {};
    beforeEach(() => {
      sandbox = sinon.createSandbox();
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should be enabled if missedMilestones feature is active', () => {
      sandbox.stub(config, 'features').value({
        missedMilestones: true
      });

      expect(MissedMilestones.isEnabled).to.be.ok;
    });

    it('should be enabled if missedMilestones feature is active', () => {
      sandbox.stub(config, 'features').value({
        missedMilestones: false
      });

      expect(MissedMilestones.isEnabled).to.not.be.ok;
    })
  })

  it('only management are allowed to access this page', () => {
    expect(page.middleware).to.eql([
      ...authentication.protect(['management'])
    ]);

    sinon.assert.calledWith(authentication.protect, ['management']);
  });

  describe('#getDepartmentsWithMissedMilestones', () => {
    const departments = [{
      id: 1,
      name: 'Dept1',
      projects: [{
        milestones: [{ id: 1, date: '13-06-2020' },{ id: 2, date: '10-05-2020' },{ id: 3, date: '05-04-2020' }]
      },{
        milestones: [{ id: 1, date: '15-06-2020' }]
      }]
    },{
      id: 2,
      name: 'Dept2',
      projects: [{
        milestones: [{ id: 1, date: '13-06-2020' }, { id: 2, date: '15-04-2020' }, { id: 3, date: '01-01-2020' }]
      },{
        milestones: [{ id: 1, date: '06-06-2020' }, { id: 2, date: '25-08-2020' }, { id: 3, date: '04-04-2020' }]
      }]
    }];

    let chartData = {};
    let departmentsWithMissedMilestones = {};

    beforeEach(async () => {
      sinon.stub(page, 'totalMilestones').returns(5);

      req.user.getDepartmentsWithProjects.returns(departments);
      chartData = await page.getChartData();
      departmentsWithMissedMilestones = await page.getDepartmentsWithMissedMilestones();
    });

    it('calls #req.user.getDepartmentsWithProjects with correct parameters', () => {
      sinon.assert.calledWith(req.user.getDepartmentsWithProjects, {
        date: { to: moment().subtract(1, 'days').format('DD/MM/YYYY') },
        complete: ['No'],
        impact: [0, 1]
      });
    });

    it('adds total milestones to each department', () => {
      expect(chartData.departments[0].totalMilestones).to.eql(5);
      expect(chartData.departments[1].totalMilestones).to.eql(5);
    });

    it('sorts departments based on total missed milestones', () => {
      expect(chartData.departments[0].id).to.eql(2);
      expect(chartData.departments[1].id).to.eql(1);
    });

    it('adds up total missed milestones', () => {
      expect(chartData.departments[0].totalMilestonesMissed).to.eql(6);
      expect(chartData.departments[1].totalMilestonesMissed).to.eql(4);
    });

    it('sorts milestones based on due date', () => {
      expect(chartData.departments[0].id).to.eql(2);
      expect(chartData.departments[1].id).to.eql(1);
    });

    it('should return chart data when passed in department', () => {
      expect(page.chartData(departments)).to.eql( { data: [6,4], labels: ['Dept2', 'Dept1'], meta: [ { totalMilestones: 5, totalMilestonesMissed: 6 }, { totalMilestones: 5, totalMilestonesMissed: 4 }] });
    });

    it('should group milestones based on due date and department', () => {
      expect(departmentsWithMissedMilestones[0].date).to.eql('01/01/2020');
      expect(departmentsWithMissedMilestones[0].departments[0].name).to.eql('Dept2');
      expect(departmentsWithMissedMilestones[0].departments[0].totalMilestonesMissed).to.eql(6);
      expect(departmentsWithMissedMilestones[0].totalMilestones).to.eql(1);
    });

  });

  describe('#totalMilestones', () => {
    it('calls Milestone.count with correct parameters and returns correct response', async () => {
      Milestone.count.resolves(5);

      const count = await page.totalMilestones({ name: 'BEIS' });

      sinon.assert.calledWith(Milestone.count, {
        include: [{
          attributes: [],
          model: Project,
          where: { departmentName: 'BEIS' },
          required: true
        }]
      });

      expect(count).to.eql(5);
    });
  });

  describe('#formatDate', () => {
    it('should format the date', () => {
      expect(page.formatDate('01/01/2020')).to.eql('1st January 2020');
    });
  });

  describe('#filtersFields', () => {
    it('should not return the filters list', () => {
      expect(page.filtersFields).to.eql(['deliveryTheme']);
    });
  });
});

