const Page = require('core/pages/page');
const { paths } = require('config');
const authentication = require('services/authentication');

class Accessibility extends Page {
  get url() {
    return paths.accessibility;
  }

  // Accessibility page is only for static users
  get middleware() {
    return [
      ...authentication.protect(['static'])
    ];
  }
}

module.exports = Accessibility;