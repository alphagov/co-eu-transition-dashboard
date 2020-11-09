const measures = require('helpers/measures');
const { notify } = require('config');
const { sinon } = require('test/unit/util/chai');
const notifyServices =require('services/notify');
const proxyquire = require('proxyquire');
const Project = require('models/project');
const Milestone = require('models/milestone');

let dailyUpdates = {};
let fnStub = sinon.stub();

const sequelizeStub = {
  fn: fnStub,
  Op: {
    gte: 'gte'
  }
}

const mockUpdatedMeasures = [{
  id: 948,
  publicId: '44444444',
  theme: 'Borders',
  name: 'Project 4444444',
  description: 'Description of project 4',
  unit: '#',
  value: 444,
  redThreshold: 2,
  aYThreshold: 4,
  greenThreshold: 6,
  groupBy: 'none',
  metricID: 'm1'
},
{
  id: 949,
  publicId: '5555555',
  theme: 'Borders',
  name: 'Project 555555',
  description: 'Description of project 5',
  unit: '#',
  value: 555,
  redThreshold: 1000,
  aYThreshold: 2000,
  greenThreshold: 3000,
  groupBy: 'none',
  metricID: 'm2'
},
{
  id: 950,
  publicId: '5555555',
  theme: 'Borders',
  name: 'Project 555555',
  description: 'Description of project 5',
  unit: '#',
  value: 555,
  redThreshold: 1000,
  aYThreshold: 2000,
  greenThreshold: 3000,
  groupBy: 'none',
  metricID: 'm2'
}]

const mockUpdatedProjects = [{
  uid: 'p1',
  title: 'project1'
},{
  uid: 'p2',
  title: 'project2'
}]

const mockUpdatedMilestones = [{
  uid: 'm1',
  description: 'milestone1',
  project:{
    uid: 'p1',
    title: 'project1'
  }
},{
  uid: 'm2',
  description: 'milestone2',
  project:{
    uid: 'p2',
    title: 'project2'
  }
}]

const mockMailingList = '1@email.com;2@email.com';
const measureEntities = ["Borders - m1 - Project 4444444", "Borders - m2 - Project 555555"];
const projects = ["p1 - project1", "p2 - project2"];
const milestones = ["p1 - m1 - milestone1", "p2 - m2 - milestone2"];

describe('notifications/dailyUpdates', () => {
  
  let getCategoryStub ;

  before(() => {
    notify['dailyUpdates'] =  {
      mailingList: mockMailingList
    }
    dailyUpdates = proxyquire('notifications/dailyUpdates', {
      'sequelize': sequelizeStub
    });
  });

  beforeEach(()=>{
    sinon.stub(measures, 'getMeasureEntities').returns(mockUpdatedMeasures);
    getCategoryStub = sinon.stub(measures, 'getCategory')
    sinon.stub(notifyServices, 'sendDailyUpdatesEmail').returns();
    getCategoryStub.onFirstCall().returns({ id: 'some-measure' });
    getCategoryStub.onSecondCall().returns({ id: 'some-measure' });
    fnStub.returns();
    Project.findAll.resolves(mockUpdatedProjects);
    Milestone.findAll.resolves(mockUpdatedMilestones);
  })

  afterEach(()=>{
    measures.getCategory.restore();
    measures.getMeasureEntities.restore();
    notifyServices.sendDailyUpdatesEmail.restore();
  })

  describe('#notifyDailyUpdates', () => {
    it('gets updated measures and calls notify', async () => {

      await dailyUpdates.notifyDailyUpdates();

      sinon.assert.calledWith(notifyServices.sendDailyUpdatesEmail, {
        emails: ['1@email.com', '2@email.com'],
        measures: measureEntities,
        projects,
        milestones
      });
    })
  });

});



