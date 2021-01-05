const Page = require('core/pages/page');
const { paths, features } = require('config');
const flash = require('middleware/flash');
const authentication = require('services/authentication');
const Role = require('models/role');
const Category = require('models/category');
const sortBy = require('lodash/sortBy');
const { getEntitiesForRoleId } = require('helpers/roleEntity');
const EntityHelper = require('helpers/entity');

class Permissions extends Page {
  static get isEnabled() {
    return features.permissions;
  }

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
    return `${this.url}/:roleId?/:categoryId?`;
  }

  get selectedCategoryId() {
    if (this.req.params.categoryId) {
      return this.req.params.categoryId;
    }
    return 0;
  }

  get selectedRoleId(){
    if (this.req.params.roleId) {
      return this.req.params.roleId;
    }
    return 0;
  }

  async entitiesForCategory(){
    if (this.req.params.categoryId) {
      this.entityHelper = new EntityHelper({ category: true, fields: ['value'] }); 
      const entitiesForCategory = await this.entityHelper.entitiesInCategories(
        [parseInt(this.req.params.categoryId)]);
      const roleEntities = await getEntitiesForRoleId(this.req.params.roleId);

      entitiesForCategory.forEach(ec => {
        const re = roleEntities.find(re => re.entityId == ec.id);
        if (re) {
          ec.edit = re.canEdit;
          ec.notSelected = false;
          ec.view = (!re.canEdit) ? true : false;
          ec.shouldCascade = re.shouldCascade;
        } else {
          ec.edit = false;
          ec.notSelected = true;
          ec.view = false;
          ec.shouldCascade = false;
        }
      });
      
      return entitiesForCategory;
    }
    return [];
  }
  
  async getRoles() {
    let roles = await Role.findAll()
    roles.push({ name: 'Select Role', id:0 });
    roles = sortBy(roles, 'id');
    return roles;
  }

  async getCategories() {
    if (this.req.params.roleId && this.req.params.roleId >0) {
      return Category.findAll();
    }
    return [];
  }
}

module.exports = Permissions;