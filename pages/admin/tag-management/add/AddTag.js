const Page = require('core/pages/page');
const { paths } = require('config');
const authentication = require('services/authentication');
const flash = require('middleware/flash');
const Entity = require('models/entity');
const EntityFieldEntry = require('models/entityFieldEntry');
const CategoryField = require('models/categoryField');
const logger = require('services/logger');
const config = require('config');
const uniqBy = require('lodash/uniqBy');
const {createTag} = require('helpers/tags');

const EMPTY_TAG_ERROR_MESSAGE = "EMPTY_TAG_NAME";
const DUPLICATE_TAG_ERROR_MESSAGE = "DUPLICATE_TAG";

class AddTag extends Page {
  get url() {
    return paths.admin.tagManagementAdd;
  }

  get pathToBind() {
    return `${this.url}/:success(success)?`;
  }

  get middleware() {
    return [
      ...authentication.protect(['admin']),
      flash
    ];
  }

  get successMode() {
    console.log('***this.req.params', this.req.params);
    return this.req.params && this.req.params.success;
  }

  async postRequest(req, res) {
    let flashMessages; 
    try {
      if (!req.body.tagName || req.body.tagName.trim().length === 0) {
        throw new Error(EMPTY_TAG_ERROR_MESSAGE)
      }
      const tag = await createTag(req.body.tagName);
      logger.info(`Tag ${tag.name} created`);
      console.log('****this.req.originalUrl', this.req.originalUrl);
      return res.redirect(`${this.req.originalUrl}/success`);
    } catch (error) {
      logger.error(error);
      if (error.message && error.message === DUPLICATE_TAG_ERROR_MESSAGE) {
        flashMessages = [{ text:'Similar tag exists, give a different name', href: '#tagName' }];
      } 
      if (error.message && error.message === EMPTY_TAG_ERROR_MESSAGE) {
        flashMessages = [{ text:'Tag cannot be empty', href: '#tagName' }];
      } else {
        flashMessages = [{ text:'something went wrong' }];
      }
      req.flash(flashMessages)
      return res.redirect(this.req.originalUrl);
    }
  }
}

module.exports = AddTag;
