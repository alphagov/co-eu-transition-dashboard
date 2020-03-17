const { expect, sinon } = require('test/unit/util/chai');
const { STRING, DATE } = require('sequelize');
const Milestone = require('models/milestone');
const MilestoneFieldEntry = require('models/milestoneFieldEntry');
const modelUtils = require('helpers/models');

describe('models/milestone', () => {
  beforeEach(() => {
    sinon.stub(modelUtils, 'createFilterOptions');
  });

  afterEach(() => {
    modelUtils.createFilterOptions.restore();
  });

  it('called Milestone.init with the correct parameters', () => {
    expect(Milestone.init).to.have.been.calledWith({
      uid: {
        type: STRING(32),
        primaryKey: true,
        displayName: 'Milestone UID'
      },
      project_uid: {
        type: STRING(32)
      },
      description: {
        type: STRING,
        allowNull: false,
        displayName: 'Milestone Description'
      },
      date: {
        type: DATE,
        allowNull: false,
        displayName: 'Due Date'
      }
    });
  });

  it('called Milestone.belongsTo with the correct parameters', () => {
    expect(Milestone.hasMany).to.have.been.calledWith(MilestoneFieldEntry, { foreignKey: 'milestone_uid' });
  });

  it.skip('returns true if attribute exsists in class', () => {
    expect(Milestone.includes('uid')).to.be.ok();
  });

  it('#createSearch', () => {
    const key = 'test';
    const options = {options: 1};
    Milestone.createSearch(key, options);
    sinon.assert.calledWith(modelUtils.createFilterOptions, key, options);
  });
});