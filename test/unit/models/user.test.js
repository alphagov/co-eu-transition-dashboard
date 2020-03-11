const User = require('models/user');
// const Department = require('models/department');
// const Project = require('models/project');
// const Milestone = require('models/milestone');
// const ProjectFieldEntry = require('models/projectFieldEntry');
const sequelize = require('sequelize');

describe.only('models/user', () => {
  it('called Projects.init with the correct parameters', async () => {

    // const user = await Project.findAll({
    //   include: { all: true }
    // });
    // console.log(user.toJSON());

    // const user = await DepartmentUser.findAll({
    //   include: { all: true }
    // })

    // const user = await User.findOne({
    //   include: [{
    //     model: Department,
    //     include: [{
    //       model: Project,
    //       include: Milestone
    //     }]
    //   }]
    // });

    // console.log(user.toJSON().departments[0].projects[0]);

    // const

    // const user = await ProjectFieldEntry.findAll({
    //   include: {all: true}
    // })

    // console.log(user);

    const user = await User.findOne({
      // include: {all: true, nested: true}
    });

    const projects = await user.getProjects({

    });

    projects.forEach(project => {
      console.log(project.fields)
      // project.milestones.forEach(milestone => console.log(milestone.fields));
    });

    // console.log(projects);
  });
});