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

  get categorySelected() {
    return this.req.params && this.req.params.publicId;
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
     
   

    console.log('sdfsdfsdsdfs', entity)
    const allowedParentCategories = await this.getAllowedParentCategories(entity.categoryId)

    console.log('allowedParentCategories', allowedParentCategories)

    return entity;

    // const entityHelper = new EntityHelper({ fields: true, category: true });
    // const entities = await entityHelper.entitiesInCategories([this.categorySelected || defaultCategoryId]);

    // for(const entity of entities) {
    //   entity.hierarchy = await entityHelper.getHierarchy(entity);
    // }

    // return entities;
  }

  async getAllowedParentCategories(categoryId) {
    return CategoryParent.findAll({
      attributes: { exclude: ['id'] },
      where: { categoryId },
    });
  }
  
}

module.exports = EntityRemap;
