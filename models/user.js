const { Model, STRING, ENUM, DATE, INTEGER, Op, literal } = require('sequelize');
const sequelize = require('services/sequelize');
const Project = require('./project');
const Milestone = require('./milestone');
const ProjectFieldEntry = require('./projectFieldEntry');
const Department = require('./department');
const DepartmentUser = require('./departmentUser');

class User extends Model {
  async getProjects (search) {

    const groupedFilters = { project: {}, milestone: {}, projectField: {}, milestoneField: {} };

    for (const searchKey of Object.keys(search)) {
      const searchItem = search[searchKey];

      if(Object.keys(Project.rawAttributes).includes(searchKey)) {
        groupedFilters.project[searchKey] = searchItem;
      } else if(Object.keys(Milestone.rawAttributes).includes(searchKey)) {
        groupedFilters.milestone[searchKey] = searchItem;
      } else if(searchKey.includes('ProjectFieldEntryFilter')) {
        groupedFilters.projectField[searchKey] = searchItem;
      }

    }

    const projectFieldEntrySearch = [];

    Object.keys(groupedFilters.projectField).forEach(filterJSON => {
      const filter = JSON.parse(filterJSON);
      const options = groupedFilters.projectField[filterJSON];

      const likeString = [];
      for(const option of options[Op.or]) {
        likeString.push(`\`${filter.path}\`.\`value\` LIKE "%${option}%"`)
      }

      const string = `\`${filter.path}\`.\`project_field_id\`=${filter.id} AND ${likeString.join(' OR ')}`;

      projectFieldEntrySearch.push(literal(string));
    });

    const departments = await this.getDepartments({
      attributes: [],
      include: [{
        model: Project,
        where: groupedFilters.project,
        include: [
          {
            model: Milestone,
            include: { all: true, nested: true },
            required: true,
            where: groupedFilters.milestone
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
              [Op.and]: projectFieldEntrySearch
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