const Page = require('core/pages/page');
const { paths } = require('config');
const restoreUserIfAuthenticated = require('middleware/restoreUserIfAuthenticated');

class Accessibility extends Page {
  get url() {
    return paths.accessibility;
  }

  // Accessibility page does not require user authentication, however if user
  // is authed attach the user to the request object for use in templates
  get middleware() {
    return [ restoreUserIfAuthenticated ];
  }
}

module.exports = Accessibility;
