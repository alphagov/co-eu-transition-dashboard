const Page = require('core/pages/page');
const { paths } = require('config');

class Accessibility extends Page {
  get url() {
    return paths.accessibility;
  }

  // Accessibility page does not require user authentication
  get middleware() {
    return [];
  }
}

module.exports = Accessibility;