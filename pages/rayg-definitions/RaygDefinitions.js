const Page = require('core/pages/page');
const { paths } = require('config');
const authentication = require('services/authentication');
const { ipWhiteList } = require('middleware/ipWhitelist');

class RaygDefinitions extends Page {
  get url() {
    return paths.raygDefinitions;
  }

  get middleware() {
    return [
      ipWhiteList,
      ...authentication.protect(['viewer', 'static'])
    ];
  }
}

module.exports = RaygDefinitions;
