const Page = require('core/pages/page');
const { paths } = require('config');
const authentication = require('services/authentication');
const { ipWhiteList } = require('middleware/ipWhitelist');
const measures = require('helpers/measures');
const entityUserPermissions = require('middleware/entityUserPermissions');

class SearchTransitionReadiness extends Page {
  get url() {
    return paths.searchTransitionReadiness;
  }

  get middleware() {
    return [
      ipWhiteList,
      ...authentication.protect(['viewer', 'static', 'devolved_administrations']),
      entityUserPermissions.assignEntityIdsUserCanAccessToLocals
    ];
  }

  async getData() {
    return measures.getMeasuresWhichUserHasAccess(this.res.locals.entitiesUserCanAccess, this.req.user.roles);
  }
}

module.exports = SearchTransitionReadiness;
