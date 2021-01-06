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
          if(this.options.roles && entity.roleEntities) {
            entity.roles = entity.roleEntities.reduce((roles, role) => {
              roles[role.roleId] = role;
              return roles;
            }, {});
            delete entity.roleEntities;
          }

          if (this.options.fields && entity.entityFieldEntries) {
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

  async entitiesInCategories(categoryIds = []) {
    if(!this.options.category) {
      throw new Error('Must include category in constructor');
    }
    return Object.values(await this.entities)
      .filter(entity => categoryIds.includes(entity.category.id))
  }

  async getEntityData(entityID) {
    const entities = await this.entities;
    if (entities[entityID]) {
      return entities[entityID];
    }
  }

  async buildHierarchy(entity, parents = []) {
    const entityCategoryId = entity.category.id;
    if(entity.parents && entity.parents.length) {
      let selectedEntityParent = entity.parents[0];
      
      if (entity.parents.length > 1) {
        // Entities can be nested and have multiple parents.  When we have multiple
        // parents we want to find the item which will has the same category ID
        for (const parent of entity.parents) {
          const parentEntity = await this.getEntityData(parent.id);

          if (parentEntity.category.id === entityCategoryId) {
            selectedEntityParent = parent;
          }  
        }
      }

      const parent = await this.getEntityData(selectedEntityParent.id)
      parents.unshift(parent);

      if (parent.parents && parent.parents.length) {
        await this.buildHierarchy(parent, parents)
      }
    }
  }

  async getHierarchy(entity) {
    const parents = [];
    await this.buildHierarchy(entity, parents)
    return parents;
  }
}

module.exports = EntityHelper;
