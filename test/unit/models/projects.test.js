const { expect } = require('test/unit/util/chai');
const Milestone = require('models/milestones');
const Projects = require('models/projects');
const { STRING, ENUM } = require('sequelize');

describe('models/projects', () => {
  it('called Projects.init with the correct parameters', () => {
    expect(Projects.init).to.have.been.calledWith({
      project_name: {
        type: STRING,
        displayName: 'Project Name',
        allowNull: false
      },
      department: {
        type: STRING,
        displayName: 'Department',
        allowNull: false,
        showCount: true
      },
      impact: {
        type: ENUM(0,1,2,3),
        values: [
          { value: 0, title: 'Very high impact' }, 
          { value: 1, title: 'High impact' },
          { value: 2, title: 'Medium impact' },
          { value: 3, title: 'Low impact' }
        ],
        allowNull: true,
        displayName: 'Impact'
      },
      hmg_confidence: {
        type: ENUM(0,1,2,3),
        values: [
          { value: 0, title: 'Very low confidence' }, 
          { value: 1, title: 'Low confidence' },
          { value: 2, title: 'Medium confidence' },
          { value: 3, title: 'High confidence' }
        ],
        allowNull: true,
        displayName: 'HMG Confidence'
      },
      citizen_readiness: {
        type: ENUM(0,1,2,3),
        values: [
          { value: 0, title: 'Very low confidence' }, 
          { value: 1, title: 'Low confidence' },
          { value: 2, title: 'Medium confidence' },
          { value: 3, title: 'High confidence' }
        ],
        allowNull: true,
        displayName: 'Citizen Readiness'
      },
      business_readiness: {
        type: ENUM(0,1,2,3),
        values: [
          { value: 0, title: 'Very low confidence' }, 
          { value: 1, title: 'Low confidence' },
          { value: 2, title: 'Medium confidence' },
          { value: 3, title: 'High confidence' }
        ],
        allowNull: true,
        displayName: 'Business Readiness'
      },
      eu_state_confidence: {
        type: ENUM(0,1,2,3),
        values: [
          { value: 0, title: 'Very low confidence' }, 
          { value: 1, title: 'Low confidence' },
          { value: 2, title: 'Medium confidence' },
          { value: 3, title: 'High confidence' }
        ],
        allowNull: true,
        displayName: 'EU State Readiness'
      },
      status: {
        type: STRING,
        allowNull: true,
        displayName: 'Status'
      }
    });
  });

  it('called Projects.hasMany with the correct parameters', () => {
    expect(Projects.hasMany).to.have.been.calledWith(Milestone, { onDelete: 'cascade', hooks: true });
  });
});