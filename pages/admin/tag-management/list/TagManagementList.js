const Page = require('core/pages/page');
const { paths } = require('config');
const authentication = require('services/authentication');
const Tag = require('models/tag');

class TagManagementList extends Page {
  get url() {
    return paths.admin.tagManagementList;
  }

  get middleware() {
    return [
      ...authentication.protect(['admin'])
    ];
  }

  async getTags() {
    return await Tag.findAll();
  }
}

module.exports = TagManagementList;
