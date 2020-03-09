const { STRING, ENUM, Model} = require('sequelize');
const sequelize = require('services/sequelize');
const Milestone = require('./milestones');

const modelDefinition = {
  impact: {
    type: ENUM(0,1,2,3),
    values: [
      { value: 0, title: 'Very high impact' }, 
      { value: 1, title: 'High impact' },
      { value: 2, title: 'Medium impact' },
      { value: 3, title: 'Low impact' }
    ],
    allowNull: true,
    displayName: 'Impact',
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
  department: {
    type: STRING,
    displayName: 'Department',
    allowNull: false,
    showCount: true
  },
  project_name: {
    type: STRING,
    displayName: 'Project Name',
    allowNull: false
  },
  status: {
    type: STRING,
    allowNull: true,
    displayName: 'Status'
  }
};

class Projects extends Model {}
Projects.init(modelDefinition, { sequelize, modelName: 'projects' });
Projects.hasMany(Milestone, { onDelete: 'cascade', hooks: true });
Projects.hasMany(Projects, { as: 'projects_count', foreignKey: 'id' });

module.exports = Projects;