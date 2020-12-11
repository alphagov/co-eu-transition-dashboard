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
const usersHelper = require('helpers/users');

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
    return User.findOne({
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
      value: role.id,
      text: role.name,
      checked: currentRoles.includes(role.id)
    }));
    return roles;
  }

  async getDepartments(userDepartments = []) {
    const currentDepartments = userDepartments.map(department => department.name)
    const departments = await Department.findAll().map(dept => ({
      value: dept.name,
      text: dept.name,
      checked: currentDepartments.includes(dept.name)
    }));
    return departments;
  }

  async getData() {
    const user = await this.getUser();
    const roles = await this.getRoles(user.roles)
    const departments = await this.getDepartments(user.departments)
    return { user, roles, departments };
  }

  async updateUser(id, email, transaction) {
    return User.update({
      email,
    }, { where: { id }, transaction });
  }

  formatDataToSave(userId, formFieldData, columnId) {
    let dataToSave = []; 
    //roles can be a string or array based on selection count
    if (Array.isArray(formFieldData)) {
      formFieldData.forEach(role => dataToSave.push({
        userId,
        [columnId]: role
      }));
    } else {
      dataToSave.push({
        userId,
        [columnId]: formFieldData
      });
    }
    return dataToSave;
  }

  async updateUserRoles(userId, roles, transaction) {
    const userRoleData = this.formatDataToSave(userId, roles, 'roleId');

    await UserRole.destroy({
      where: { userId },
      transaction
    });

    await UserRole.bulkCreate(userRoleData, { transaction });
  }

  async updateUserDepartments(userId, departments, transaction) {
    const departmentsData = this.formatDataToSave(userId, departments, 'departmentName');

    await DepartmentUser.destroy({
      where: { userId },
      transaction
    });
    await DepartmentUser.bulkCreate(departmentsData, { transaction });
  }

  async updateData({ email, roles, departments }) {
    const transaction = await sequelize.transaction();
    try {
      const { userId } = this.req.params;
      await this.updateUser(userId, email, transaction);
      await this.updateUserRoles(userId, roles, transaction);
      await this.updateUserDepartments(userId, departments, transaction); 
      await transaction.commit();
    } catch(error) {
      logger.error(error);
      await transaction.rollback();
      throw error;
    }
  }

  async postRequest(req, res) {
    try {
      const { userId } = req.params
      await usersHelper.errorValidations({ ...req.body, userId });
      await this.updateData({ ...req.body });
      return res.redirect(`${this.req.originalUrl}/success`);
    } catch (error) {
      let flashMessages ;
      if (error.messages) {
        flashMessages = error.messages;
      } else {
        flashMessages =[{ text:"something went wrong" }];
      }
      req.flash(flashMessages)
      return res.redirect(this.req.originalUrl);
    }
  }
}

module.exports = EditUser;