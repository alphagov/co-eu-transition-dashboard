const measures = require('helpers/measures');
const { notify } = require('config');
const { sinon } = require('test/unit/util/chai');
const notifyServices =require('services/notify');
const proxyquire = require('proxyquire');

let updatedMeasures = {};
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
const mockMailingList = '1@email.com;2@email.com';
const measureEntities = ["Borders m1 Project 4444444", "Borders m2 Project 555555"];

describe('notifications/updatedMeasures', () => {
  
  let getCategoryStub ;

  before(() => {
    notify['updatedMeasures'] =  {
      mailingList: mockMailingList
    }
    updatedMeasures = proxyquire('notifications/updatedMeasures', {
      'sequelize': sequelizeStub
    });
  });

  beforeEach(()=>{
    sinon.stub(measures, 'getMeasureEntities').returns(mockUpdatedMeasures);
    getCategoryStub = sinon.stub(measures, 'getCategory')
    sinon.stub(notifyServices, 'sendMeasuresUpdatedTodayEmail').returns();
    getCategoryStub.onFirstCall().returns({ id: 'some-measure' });
    getCategoryStub.onSecondCall().returns({ id: 'some-measure' });
    fnStub.returns();
  })

  afterEach(()=>{
    measures.getCategory.restore();
    measures.getMeasureEntities.restore();
    notifyServices.sendMeasuresUpdatedTodayEmail.restore();
  })

  describe('#notifyUpdatedMeasures', () => {
    it('gets updated measures and calls notify', async () => {

      await updatedMeasures.notifyUpdatedMeasures();

      sinon.assert.calledWith(notifyServices.sendMeasuresUpdatedTodayEmail, {
        emails: ['1@email.com', '2@email.com'],
        measures: measureEntities
      });
    })
  });

});



