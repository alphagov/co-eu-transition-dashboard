const Page = require('core/pages/page');
const { paths } = require('config');
const EntityHelper = require('helpers/entity');
const authentication = require('services/authentication');
const Category = require('models/category');

class EntityList extends Page {
  get url() {
    return paths.admin.entityList;
  }

  get pathToBind() {
    return `${this.url}/:categoryId?`;
  }

  get middleware() {
    return [
      ...authentication.protect(['admin'])
    ];
  }

  get categorySelected() {
    return this.req.params && parseInt(this.req.params.categoryId) || 0;
  }

  async getCategories() {
    return await Category.findAll();
  }

  async getEntitiesForCategory(defaultCategoryId) {
    const entityHelper = new EntityHelper({ fields: true, category: true });
    const entities = await entityHelper.entitiesInCategories([this.categorySelected || defaultCategoryId]);

    for(const entity of entities) {
      entity.parents = await entityHelper.getParents(entity);
    }

    return entities;
  }
}

module.exports = EntityList;
