const Page = require('core/pages/page');
const { paths, features } = require('config');
const flash = require('middleware/flash');
const authentication = require('services/authentication');
const Role = require('models/role');
const Category = require('models/category');
const sortBy = require('lodash/sortBy');
const { 
  getEntitiesForRoleId, 
  doesEntityHasParentsPermission,
  updateRoleEntityTableForRole
} = require('helpers/roleEntity');
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
    return `${this.url}/:roleId?/:categoryId?/:success?`;
  }

  get successMode() {
    return this.req.params && this.req.params.success;
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
        ec.name = (ec.name) ? ec.name : 'Entity name is not set';
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

  handleFormData(formData, roleEntities, roleId) {
    let entitiesToUpdate = [];
    let entitiesToDelete = [];
    for(const entityId in formData) {
      const options = formData[entityId];
      const noneFound = (Array.isArray(options))? options.includes('none') : null;
      const cascadeFound = options.includes('cascade');
      if (noneFound && cascadeFound) {
        throw new Error('You can not select both None and Cascade for an entity');
      }

      if (options === 'none' && entityId in roleEntities) {
        entitiesToDelete.push(entityId)
        continue;
      } 

      if ((options != 'none' && !(entityId in roleEntities)) || (entityId in roleEntities && options)){
        entitiesToUpdate.push({
          roleId,
          entityId,
          canEdit: (options==='edit' || options.includes('edit')) ? true : false,
          shouldCascade: (options==='cascade' || options.includes('cascade')) ? true : false
        });
        continue;
      }
    }
    return {
      entitiesToUpdate,
      entitiesToDelete
    }
  }

  async postRequest(req, res) {
    const roleId = req.params.roleId;
    const roleEntities = await getEntitiesForRoleId(roleId);
    try {
      const data = this.handleFormData(req.body, roleEntities, roleId);
      await updateRoleEntityTableForRole(roleId, data);
      return res.redirect(`${req.originalUrl}/success`);
    } catch(error) {
      req.flash(error.message)
      return res.redirect(this.req.originalUrl);
    }
  }
}

module.exports = Permissions;