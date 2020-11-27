const Page = require('core/pages/page');
const { paths } = require('config');
const entityUserPermissions = require('middleware/entityUserPermissions');
const flash = require('middleware/flash');
const authentication = require('services/authentication');
const Category = require('models/category');
const Entity = require('models/entity');
const sequelize = require('services/sequelize');
const logger = require('services/logger');
const transitionReadinessData = require('helpers/transitionReadinessData');
const cache = require('services/cache');

class RaygValues extends Page {
  get url() {
    return paths.admin.raygValues;
  }

  get pathToBind() {
    return `${this.url}/:successful(successful)?`;
  }

  get successfulMode() {
    return this.req.params && this.req.params.successful;
  }

  get middleware() {
    return [
      ...authentication.protect(["admin"]),
      entityUserPermissions.assignEntityIdsUserCanAccessToLocals,
      flash
    ];
  }

  isValid(body, entityIds) {
    const errors = [];

    Object.keys(body).forEach(key => {
      if (!entityIds.includes(key)) {
        errors.push("Invalid Entity ID");
      }
    });

    return errors;
  }

  buildEntitiesToBeSaved(body, entities) {
    return Object.keys(body).map(key => ({
      publicId: entities[key].publicId,
      categoryId: entities[key].categoryId,
      raygStatus: body[key]
    }));
  }

  flatternEntityData(entities) {
    const flatternedEntityData = {};
    for (const entity of entities) {
      flatternedEntityData[entity.id] = entity;

      if (entity.children) {
        for (const child of entity.children) {
          flatternedEntityData[child.id] = child;
        }
        delete entity.children;
      }
    }

    return flatternedEntityData;
  }

  async postRequest(req, res) {
    const themeAndStatementData = await this.getThemesAndTopLevelStatements();
    const flatternedEntityData = this.flatternEntityData(themeAndStatementData);
    const formErrors = this.isValid(req.body, Object.keys(flatternedEntityData));

    if (formErrors && formErrors.length) {
      req.flash(formErrors);
      return res.redirect(req.originalUrl);
    }

    const entitiesToBeSave = this.buildEntitiesToBeSaved(req.body,flatternedEntityData);
    await this.saveData(entitiesToBeSave);
  }

  async saveData(entitiesToBeSave) {
    const categories = await Category.findAll({
      where: { name: ["Theme", "Statement"] }
    });

    const themeCategory = categories.find(category => category.name === "Theme");
    const statmentCategory = categories.find(category => category.name === "Statement");

    const themeCategoryFields = await Category.fieldDefinitions("Theme");
    const statementCategoryFields = await Category.fieldDefinitions("Statement");

    const transaction = await sequelize.transaction();
    let redirectUrl = this.req.originalUrl;

    try {
      for (const entity of entitiesToBeSave) {
        const category = entity.categoryId === themeCategory.id ? themeCategory : statmentCategory;
        const categoryFields = entity.categoryId === themeCategory.id ? themeCategoryFields : statementCategoryFields;
        await Entity.import(entity, category, categoryFields, { transaction, ignoreParents: true });
      }
      await transaction.commit();
      cache.clear();
      redirectUrl += "/successful";
    } catch (error) {
      logger.error(error);
      this.req.flash(["Error saving data"]);
      await transaction.rollback();
    }
    return this.res.redirect(redirectUrl);
  }

  async getThemesAndTopLevelStatements() {
    const themeEntities = await transitionReadinessData.getThemeEntities(
      this.res.locals.entitiesUserCanAccess
    );

    for (const themeEntity of themeEntities) {
      if (themeEntity.children) {
        themeEntity.children = await transitionReadinessData.filterTopLevelOutcomeStatementsChildren(themeEntity.children);
      }
    }
    return themeEntities;
  }
}

module.exports = RaygValues;
