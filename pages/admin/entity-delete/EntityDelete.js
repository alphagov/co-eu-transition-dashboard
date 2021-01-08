const Page = require('core/pages/page');
const { paths } = require('config');
const authentication = require('services/authentication');
const Entity = require('models/entity');
const EntityFieldEntry = require('models/entityFieldEntry');
const CategoryField = require('models/categoryField');

class EntityDelete extends Page {
  get url() {
    return paths.admin.entityDelete;
  }

  get pathToBind() {
    return `${this.url}/:publicId`;
  }

  get middleware() {
    return [
      ...authentication.protect(['admin'])
    ];
  }

  async getEntity() {
    const entity = await Entity.findOne({
      where: {
        public_id: this.req.params.publicId
      },
      include: [{
        model: Entity,
        as: 'children',
        include: {
          model: EntityFieldEntry,
          include: {
            model: CategoryField
          }
        }
      }, {
        model: EntityFieldEntry,
        include: {
          model: CategoryField
        }
      }]
    });

    entity.entityFieldEntries.map(entityfieldEntry => {
      entity[entityfieldEntry.categoryField.name] = entityfieldEntry.value;
    });

    if (entity.children.length) {
      for (const child of entity.children) {
        child.entityFieldEntries.map(entityfieldEntry => {
          child[entityfieldEntry.categoryField.name] = entityfieldEntry.value;
        });
      }
    }

    return entity;
  }

  async deleteEntity() {
    return Entity.destroy({
      where: {
        public_id: this.req.params.publicId
      }
    });
  }

  async postRequest(req, res) {
    await this.deleteEntity();
    return res.redirect(paths.admin.entityDelete);
  }
}

module.exports = EntityDelete;
