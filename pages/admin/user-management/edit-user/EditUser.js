const Page = require('core/pages/page');
const { paths } = require('config');
const flash = require('middleware/flash');
const sequelize = require('services/sequelize');
const Role = require("models/role");
const UserRole = require("models/userRole");
const Department = require("models/department");
const DepartmentUser = require("models/departmentUser");
const User = require("models/user");
const authentication = require('services/authentication');
const logger = require('services/logger');

const VALIDATION_ERROR_MESSSAGE = 'VALIDATION_ERROR';

class EditUser extends Page {
  get url() {
    return paths.admin.editUser;
  }

  get pathToBind() {
    return `${this.url}/:userId/:success(success)?`;
  }

  get editUrl() {
    return `${this.url}/${this.req.params.userId}`;
  }

  get middleware() {
    return [ 
      ...authentication.protect(['admin']), 
      flash 
    ]
  }

  get successMode() {
    return this.req.params && this.req.params.success;
  }

  async getUser() {
    return await User.findOne({
      where: {
        id: this.req.params.userId
      },
      include: [{
        model: Department
      },{
        model: Role
      }]
    });
  }
  
  async getRoles(userRoles = []) {
    const currentRoles = userRoles.map(role => role.id);
    const roles = await Role.findAll().map(role => ({
      value: role.dataValues.id,
      text: role.dataValues.name,
      checked: currentRoles.includes(role.dataValues.id)
    }));
    return roles;
  }

  async getDepartments(userDepartments = []) {
    const currentDepartments = userDepartments.map(department => department.id)
    const departments = await Department.findAll().map(dept => ({
      value: dept.dataValues.name,
      text: dept.dataValues.name,
      checked: currentDepartments.includes(dept.dataValues.id)
    }));
    return departments;
  }

  async getData() {
    const user = await this.getUser();
    const roles = await this.getRoles(user.roles)
    const departments = await this.getDepartments(user.departments)
    return { user, roles, departments };
  }

  async createUserDB(id, email, transaction) {
    const user = await User.update({
      email,
    }, { where: { id }, transaction });
    return user;
  }

  async createRolesDB(userId, roles, transaction) {
    let rolesToInsert = [];
    
    //roles can be a string or array based on selection count
    if (Array.isArray(roles)) {
      roles.forEach(role => rolesToInsert.push({
        userId,
        roleId: role
      }));
    } else {
      rolesToInsert.push({
        userId,
        roleId: roles
      });
    }
    
    return UserRole.bulkCreate(rolesToInsert, { transaction });
  }

  async createDepartmentUserDB(userId, departments, transaction) {
    let departmentsToInsert = [];

    //departments can be a string or array based on selection count
    if (Array.isArray(departments) ) {
      departments.forEach(department => (
        departmentsToInsert.push({
          userId,
          departmentName: department
        })
      ));
    } else {
      departmentsToInsert.push({
        userId,
        departmentName: departments
      });
    }

    return DepartmentUser.bulkCreate(departmentsToInsert, { transaction });
  }

  async createUser({ email, roles, departments }) {
    const transaction = await sequelize.transaction();
    try {
      const user = await this.createUserDB(this.req.params.userId, email, transaction);
      // const userRoles = await this.createRolesDB(user.id,roles, t);
      // const departmentUser = await this.createDepartmentUserDB(user.id, departments, t);
      console.log('CRERE', email, roles, departments)
      
      await transaction.commit();


      return user;
    } catch(error) {
      logger.error(error);
      await transaction.rollback();
      throw error;
    }
  }

  async errorValidations({ email, roles, departments }) {
    let error = new Error(VALIDATION_ERROR_MESSSAGE);
    error.messages = [];
    let userExists;
    if (!email) {
      error.messages.push({ text:'Email cannot be empty', href: '#username' });
    } else {
      // Check if user exists
      userExists = await User.findOne({ where: { email } });
    }
    if (userExists) {
      error.messages.push({ text:'Email exists', href: '#username' });
    }
    if (!roles) {
      error.messages.push({ text:'Roles cannot be empty', href: '#roles' });
    }
    if(!departments) {
      error.messages.push({ text:'Departments cannot be empty', href: '#departments' });
    }
    console.log('ererer', error)
    if (error.messages.length > 0) {
      throw error;
    } 
  }

  async postRequest(req, res) {
    try{
      await this.errorValidations({ ...req.body });
      await this.createUser({ ...req.body });
      return res.redirect(`${this.req.originalUrl}/success`);
    } catch (error) {
      let flashMessages ;
      if (error.message && error.message === VALIDATION_ERROR_MESSSAGE) {
        flashMessages= error.messages;
      } else if (error.message) {
        flashMessages = [{ text: error.message }]; 
      } else {
        flashMessages =[{ text:"something went wrong" }];
      }
      req.flash(flashMessages)
      return res.redirect(this.req.originalUrl);
    }
  }
}

module.exports = EditUser;