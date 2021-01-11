const Page = require('core/pages/page');
const { paths } = require('config');
const EntityHelper = require('helpers/entity');
const authentication = require('services/authentication');
const Category = require('models/category');
const CategoryField = require('models/categoryField');
const CategoryParent = require('models/categoryParent');
const Entity = require('models/entity');
const EntityFieldEntry = require('models/entityFieldEntry');
const EntityParent = require('models/entityParent');
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

  async getCategoryParents(categoryId) {
    return CategoryParent.findAll({
      attributes: { exclude: ['id'] },
      where: { categoryId },
    });
  }

  async getEntity() {
    const entity = await Entity.findOne({
      where: { publicId: this.req.params.publicId },
      include: [{
        model: EntityFieldEntry,
        include: {
          model: CategoryField,
        }
      },
      {
        model: EntityParent,
        as: 'entityParents',
      }]
    });

    entity.entityFieldEntries.map(entityfieldEntry => {
      entity[entityfieldEntry.categoryField.name] = entityfieldEntry.value;
    });
   
    entity.parents =  entity.entityParents.map(entityParent => entityParent.parentEntityId);
    
    return entity;
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
