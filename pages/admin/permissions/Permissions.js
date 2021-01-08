const Page = require('core/pages/page');
const { paths, features } = require('config');
const flash = require('middleware/flash');
const authentication = require('services/authentication');
const Role = require('models/role');
const Category = require('models/category');
const sortBy = require('lodash/sortBy');
const { getEntitiesForRoleId, doesEntityHasParentsPermission } = require('helpers/roleEntity');
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
      this.entityHelper = new EntityHelper({ category: true, fields: true }); 
      const entitiesForCategory = await this.entityHelper.entitiesInCategories(
        [parseInt(this.req.params.categoryId)]);
      const roleEntities = await getEntitiesForRoleId(this.req.params.roleId);
      for (const ec of entitiesForCategory) {
        if (ec.id in roleEntities) {
          ec.edit = roleEntities[ec.id].canEdit;
          ec.notSelected = false;
          ec.view = (!roleEntities[ec.id].canEdit) ? true : false;
          ec.shouldCascade = roleEntities[ec.id].shouldCascade;
        } else {
          ec.edit = false;
          ec.notSelected = true;
          ec.view = false;
          ec.shouldCascade = false;
        }
        const hierarchy = await this.entityHelper.getHierarchy(ec);
        ec.hasParentsPermission = doesEntityHasParentsPermission(roleEntities, hierarchy);
      }
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