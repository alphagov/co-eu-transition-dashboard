const { Model, STRING, ENUM, DATE, INTEGER, Op, literal } = require('sequelize');
const sequelize = require('services/sequelize');
const Project = require('./project');
const Milestone = require('./milestone');
const ProjectFieldEntry = require('./projectFieldEntry');
const Department = require('./department');
const DepartmentUser = require('./departmentUser');

class User extends Model {
  async getProjects (search) {

    const departments = await this.getDepartments({
      attributes: [],
      include: [{
        model: Project,
        where: search.project,
        include: [
          {
            model: Milestone,
            include: { all: true, nested: true },
            required: true,
            where: search.milestone
          },
          {
            model: ProjectFieldEntry,
            include: sequelize.models.projectField
          },
          {
            required: true,
            as: 'ProjectFieldEntryFilter',
            attributes: [],
            model: ProjectFieldEntry,
            where: {
              [Op.and]: search.projectField
            }
          }
        ]
       }]
    });

    return departments.reduce((projects, department) => {
      projects.push(...department.get('projects'));
      return projects;
    }, []);
  }
}

User.init({
  id: {
    type: INTEGER,
    primaryKey: true
  },
  email: STRING,
  hashed_passphrase: STRING(128),
  last_login_at: DATE,
  role: {
    type: ENUM('admin', 'user')
  }
}, { sequelize, modelName: 'user', tableName: 'user', timestamps: false });

User.belongsToMany(Department, { through: DepartmentUser, foreignKey: 'user_id' });
Department.belongsToMany(User, { through: DepartmentUser, foreignKey: 'department_name' });

module.exports = User;