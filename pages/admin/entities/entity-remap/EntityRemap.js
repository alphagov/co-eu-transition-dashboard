const Page = require('core/pages/page');
const { paths } = require('config');
const EntityHelper = require('helpers/entity');
const authentication = require('services/authentication');
const Category = require('models/category');
const Entity = require('models/entity');
const CategoryField = require('models/categoryField');
const EntityFieldEntry = require('models/entityFieldEntry');
const CategoryParent = require('models/CategoryParent');
class EntityRemap extends Page {
  get url() {
    return paths.admin.entityRemap;
  }

  get pathToBind() {
    return `${this.url}/:publicId`;
  }

  get middleware() {
    return [
      ...authentication.protect(['admin'])
    ];
  }

  async getCategories() {
    const categories = await Category.findAll();

    return categories.reduce((acc, category) => {
      return { ...acc, [category.id]: category.name };
    }, {})
  }

  async getEntity() {
    const entity = await Entity.findOne({
      where: { publicId: this.req.params.publicId },
      include: [{
        model: EntityFieldEntry,
        include: {
          model: CategoryField,
        }
      }]
    });

    entity.entityFieldEntries.map(entityfieldEntry => {
      entity[entityfieldEntry.categoryField.name] = entityfieldEntry.value;
    });
     
    return entity;
  }

  async getCategoryParents(categoryId) {
    return CategoryParent.findAll({
      attributes: { exclude: ['id'] },
      where: { categoryId },
    });
  }

  async getParentEntities(entity) {
    const categoryParents = await this.getCategoryParents(entity.categoryId);
    const categoryIds = categoryParents.map(category => category.parentCategoryId);

    const entityHelper = new EntityHelper({ fields: true, category: true });
    const entities = await entityHelper.entitiesInCategories(categoryIds);

    for (const entity of entities) {
      entity.hierarchy = await entityHelper.getHierarchy(entity);
    }

    const entitiesByCategory = entities.reduce((acc, entity) => {
      acc[entity.category.id] = [ ...(acc[entity.category.id] || []), entity]
      return acc
    }, {});

    return entitiesByCategory;
  }
}

module.exports = EntityRemap;
