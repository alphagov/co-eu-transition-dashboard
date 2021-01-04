const Entity = require('models/entity');
const RoleEntity = require('models/roleEntity');
const EntityFieldEntry = require('models/entityFieldEntry');
const Category = require('models/category');
const CategoryField = require('models/categoryField');

class EntityHelper {
  constructor(options = { role: false, fields: false, category: false }) {
    this.options = options;
    this.entities = this.constructEntityMap();
  }

  constructEntityMap() {
    const include = [
      {
        attributes: ['id'],
        model: Entity,
        as: 'children'
      }, {
        attributes: ['id'],
        model: Entity,
        as: 'parents'
      }
    ];

    if(this.options.roles) {
      include.push({
        attributes: ['roleId'],
        model: RoleEntity
      });
    }

    if(this.options.fields) {
      include.push({
        seperate: true,
        model: EntityFieldEntry,
        include: {
          attributes: ['name'],
          model: CategoryField,
          where: { isActive: true }
        }
      });
    }

    if(this.options.category) {
      include.push({
        model: Category
      });
    }

    return Entity.findAll({
      attributes: ['publicId', 'id'],
      include
    })
      .then(entities => {
        return entities.reduce((entities, entity) => {
          if(this.options.roles) {
            entity.roles = entity.roleEntities.reduce((roles, role) => {
              roles[role.roleId] = role;
              return roles;
            }, {});
            delete entity.roleEntities;
          }

          if (this.options.fields) {
            entity.entityFieldEntries.forEach(entityFieldEntry => {
              entity[entityFieldEntry.categoryField.name] = entityFieldEntry.value;
            }, {});
          }

          entities[entity.id] = entity;
          return entities;
        }, {});
      });
  }

  async getAllEntities() {
    return Object.values(await this.entities);
  }

  async entitiesWithRoles(roles) {
    if(!this.options.roles) {
      throw new Error('Must include roles in constructor');
    }

    return Object.values(await this.entities)
      .filter(entity => {
        const entityHasRole = roles.find(role => entity.roles[role.id]);
        return entityHasRole;
      }, {});
  }

  async entitiesInCategories(categoryIds) {
    if(!this.options.category) {
      throw new Error('Must include category in constructor');
    }

    const categoryIdsAsObject = categoryIds.reduce((categoryIdsAsObject, categoryId) => {
      categoryIdsAsObject[categoryId] = true;
      return categoryIdsAsObject;
    }, {});

    return Object.values(await this.entities)
      .filter(entity => {
        return categoryIdsAsObject[entity.category.id];
      }, {});
  }

  async getParent(entity = {}) {
    const entities = await this.entities;
    if(entity.parents && entity.parents.length) {
      return await entities[entity.parents[0].id];
    }
  }

  async getHierarchy(entity) {
    const parents = [];

    let parent = entity;
    do {
      parent = await this.getParent(parent);
      if(parent) {
        parents.push(parent);
      }
    } while (parent);

    return parents.reverse();
  }
}

module.exports = EntityHelper;
