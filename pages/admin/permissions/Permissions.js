const Page = require('core/pages/page');
const { paths } = require('config');
const flash = require('middleware/flash');
const authentication = require('services/authentication');
const Role = require('models/role');
const Category = require('models/category');
const sortBy = require('lodash/sortBy');


class Permissions extends Page {
  get url() {
    return paths.admin.permissions;
  }

  get middleware() {
    return [
      ...authentication.protect(['admin']),
      flash
    ];
  }

  get pathToBind() {
    return `${this.url}/:roleId/:categoryId?`;
  }

  get selectedCategoryId() {
    if (this.req.params.categoryId)
      return this.req.params.categoryId;
    return 0;
  }

  get selectedRoleId(){
    if (this.req.params.roleId)
      return this.req.params.roleId;
    return 0;
  }
  
  async getRoles() {
    let roles = await Role.findAll()
    roles.push({ name: 'Select Role', id:0 });
    roles = sortBy(roles);
    return roles;
  }

  async getCategories() {
    if (this.req.params.roleId && this.req.params.roleId >0)
      return Category.findAll();
    return [];
  }
}

module.exports = Permissions;