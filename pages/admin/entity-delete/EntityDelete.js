const Page = require('core/pages/page');
const { paths } = require('config');
const authentication = require('services/authentication');
const Entity = require('models/entity');
const EntityFieldEntry = require('models/entityFieldEntry');

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
    return Entity.findOne({
      where: {
        public_id: this.req.params.publicId
      },
      include: [{
        model: Entity,
        as: 'children',
        include: {
          model: EntityFieldEntry,
        }
      }, {
        model: EntityFieldEntry,
      }]
    });
  }
}

module.exports = EntityDelete;
