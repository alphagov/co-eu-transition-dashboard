const Page = require('core/pages/page');
const { paths } = require('config');
const authentication = require('services/authentication');
const flash = require('middleware/flash');
const Tag = require('models/tag');
const Entity = require('models/entity');
const EntityFieldEntry = require('models/entityFieldEntry');
const CategoryField = require('models/categoryField');
const logger = require('services/logger');
const config = require('config');

class DeleteTag extends Page {
  get url() {
    return paths.admin.tagManagementDelete;
  }

  get pathToBind() {
    return `${this.url}/:tagId`;
  }

  get middleware() {
    return [
      ...authentication.protect(['admin']),
      flash
    ];
  }

  async getTag() {
    const tag = await Tag.findOne({
      where: {
        id: this.req.params.tagId
      },
      include: {
        model: Entity,
        include: {
          model: EntityFieldEntry,
          include: CategoryField
        }
      }
    });

    tag.entities = tag.entities.map(entity => {
      const entityMapped = {};

      entity.entityFieldEntries.forEach(entityFieldEntry => {
        entityMapped[entityFieldEntry.categoryField.name] = entityFieldEntry.value;
      }, {});

      return entityMapped;
    });

    return tag;
  }

  async deleteTag() {
    return Tag.destroy({
      where: {
        id: this.req.params.tagId
      }
    });
  }

  async postRequest(req, res) {
    try {
      await this.deleteTag();
    } catch (error) {
      logger.error(error);
      req.flash("An error occoured when deleting the tag.");
      return res.redirect(this.req.originalUrl);
    }

    return res.redirect(config.paths.admin.tagManagementList);
  }
}

module.exports = DeleteTag;
