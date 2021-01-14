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
const sequelize = require('services/sequelize');
const logger = require('services/logger');
class EntityRemap extends Page {
  constructor(path, req, res) {
    super(path, req, res)
    this.entityHelper = new EntityHelper({ fields: true, category: true });
  }

  get url() {
    return paths.admin.entityRemap;
  }

  get successMode() {
    return this.req.params && this.req.params.success;
  }

  get pathToBind() {
    return `${this.url}/:publicId/:success(success)?`;
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

  async getParentEntities(selectedEntity) {
    const categoryParents = await this.getCategoryParents(selectedEntity.categoryId);
    const categoryIds = categoryParents.map(category => category.parentCategoryId);
    const entities = await this.entityHelper.entitiesInCategories(categoryIds);

    for (const entity of entities) {
      entity.hierarchy = await this.entityHelper.getHierarchy(entity);
    }

    const entitiesByCategory = entities.reduce((acc, entity) => {
      if (entity.publicId !== selectedEntity.publicId) {
        acc[entity.category.id] = [ ...(acc[entity.category.id] || []), entity]
      }
      
      return acc
    }, {});

    return entitiesByCategory;
  }

  async validatePostData({ remapEntities = {} }, selectedEntity) {
    const errors = [];
    const entityCategories = [];

    if (Object.keys(remapEntities).length === 0) {
      errors.push("Must selected at least on parent entity");
    }
    
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

  formatPostData({ remapEntities }, selectedEntity) {
    return Object.keys(remapEntities).map(parentEntityId => ({
      entityId: selectedEntity.id,
      parentEntityId
    }));
  }

  async saveData(entityParentData, selectedEntity) {
    const transaction = await sequelize.transaction();

    try {
      await EntityParent.destroy({
        where: { entityId: selectedEntity.id },
        transaction
      });

      await EntityParent.bulkCreate(entityParentData, { transaction });

      await transaction.commit();
    } catch (error) {
      logger.error(error);
      await transaction.rollback();
      throw error;
    }
  }

  async postRequest(req, res) {
    const selectedEntity = await this.getEntity()
    const formErrors = await this.validatePostData(req.body, selectedEntity);

    if (formErrors && formErrors.length) {
      req.flash(formErrors);
      return res.redirect(req.originalUrl);
    }

    try {
      const entityParentData = this.formatPostData(req.body, selectedEntity);
      await this.saveData(entityParentData, selectedEntity);
      return res.redirect(`${req.originalUrl}/success`);
    } catch(error) {
      req.flash([error.message])
      return res.redirect(req.originalUrl);
    }
  }
}

module.exports = EntityRemap;
