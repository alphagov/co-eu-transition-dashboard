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
const flash = require('middleware/flash');
class EntityRemap extends Page {
  constructor(path, req, res) {
    super(path, req, res)
    this.entityHelper = new EntityHelper({ fields: true, category: true });
  }

  get url() {
    return paths.admin.entityRemap;
  }

  get pathToBind() {
    return `${this.url}/:publicId`;
  }

  get middleware() {
    return [
      ...authentication.protect(['admin']),
      flash
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

    
    const entities = await this.entityHelper.entitiesInCategories(categoryIds);

    for (const entity of entities) {
      entity.hierarchy = await this.entityHelper.getHierarchy(entity);
    }

    const entitiesByCategory = entities.reduce((acc, entity) => {
      acc[entity.category.id] = [ ...(acc[entity.category.id] || []), entity]
      return acc
    }, {});

    return entitiesByCategory;
  }

  async validatePostData({ remapEntities = {} }, selectedEntity) {
    const errors = [];
    const entityCategories = [];
    
    for (const entityId in remapEntities) {
      const entityData = await this.entityHelper.getEntityData(entityId);
      entityCategories.push(entityData.category.id);
    }

    const categoryParents = await this.getCategoryParents(selectedEntity.categoryId);

    categoryParents.forEach(category => {
      if (category.isRequired && !entityCategories.includes(category.parentCategoryId)) {
        errors.push("Required category missing");
      }
    })

    return errors;
  }

  async postRequest(req, res) {

    const selectedEntity = await this.getEntity()

    const formErrors = await this.validatePostData(req.body, selectedEntity);
    console.log('formErrors', formErrors)
    if (formErrors && formErrors.length) {
      req.flash(formErrors);
      return res.redirect(req.originalUrl);
    }

    // Get entity
    // Get category parents for entity

    // validate post data contains require parents
      // use post data key to get entity -> cateogry
        //
    // if pass validation, save
    //if not error

  
    console.log('selectedEntity', selectedEntity)
    // console.log('categoryParents', categoryParents)




    // const entitiesToBeSave = this.buildEntitiesToBeSaved(req.body,flatternedEntityData);
    // await this.saveData(entitiesToBeSave);

    return res.redirect(req.originalUrl);
  }
}

module.exports = EntityRemap;
