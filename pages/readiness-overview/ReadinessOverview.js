const Page = require('core/pages/page');
const { paths } = require('config');
const authentication = require('services/authentication');
const groupBy = require('lodash/groupBy');
const transitionReadinessData = require('helpers/transitionReadinessData');
const HeadlineMeasures = require('models/headlineMeasures');
const { ipWhiteList } = require('middleware/ipWhitelist');
const entityUserPermissions = require('middleware/entityUserPermissions');
const sequelize = require('services/sequelize');
const moment = require('moment');
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
    const data = await transitionReadinessData.overview(this.res.locals.entitiesUserCanAccess,paths.transitionReadinessThemeDetail, headlinePublicIds.map(entity => entity.entityPublicId));

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

  async getLastUpdatedAt() {
    const [result] = await sequelize.query(`
      SELECT MAX(updated_at) AS updated_at
      FROM entity`);
    return moment(result[0].updated_at).format("dddd, MMMM Do YYYY, h:mma");
  }
}

module.exports = ReadinessOverview;
