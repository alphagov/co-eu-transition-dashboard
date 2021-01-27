const Page = require('core/pages/page');
const { paths } = require('config');
const authentication = require('services/authentication');
const groupBy = require('lodash/groupBy');
const transitionReadinessData = require('helpers/transitionReadinessData');
const HeadlineMeasures = require('models/headlineMeasures');
const { ipWhiteList } = require('middleware/ipWhitelist');
const entityUserPermissions = require('middleware/entityUserPermissions');
class ReadinessOverview extends Page {
  get url() {
    return paths.readinessOverview;
  }

  get searchUrl() {
    return paths.searchTransitionReadiness
  }

  get middleware() {
    return [
      ipWhiteList,
      ...authentication.protect(['viewer', 'static', 'devolved_administrations']),
      entityUserPermissions.assignEntityIdsUserCanAccessToLocals
    ];
  }

  async data() {
    const headlinePublicIds = await HeadlineMeasures.findAll({
      order: ['priority']
    });
    // this.req.user.roles
    const data = await transitionReadinessData.overview(
      this.res.locals.entitiesUserCanAccess,paths.transitionReadinessThemeDetail, headlinePublicIds.map(entity => entity.entityPublicId),
      this.req.user.roles
    );

    data.allThemes.forEach(entity => {
      entity.link = `${paths.transitionReadinessThemeDetail}/${entity.publicId}`;
      entity.active = true;
    });

    const themesGrouped = groupBy(data.allThemes, theme => theme.color);

    return {
      headlineMeasures: data.headlineEntites,
      themes: themesGrouped
    };
  }
}

module.exports = ReadinessOverview;
