const Page = require('core/pages/page');
const { paths } = require('config');
const authentication = require('services/authentication');
const { ipWhiteList } = require('middleware/ipWhitelist');

class SearchTransitionReadiness extends Page {
  get url() {
    return paths.searchTransitionReadiness;
  }

  get middleware() {
    return [
      ipWhiteList,
      ...authentication.protect(['viewer', 'static', 'devolved_administrations'])
    ];
  }

  static get isEnabled() {
    return true;
  }
 
  getMeasures() {
    const measures = [{ id: 'm1', theme: 'Borders', name: 'Measure 1', link:'B/s1/m1', RAYGStatus: 'x' },
      { id: 'm2', theme: 'Borders', name: 'Measure 2', link:'B/s1/m2', RAYGStatus: 'y' }]
    return measures;
  }
}

module.exports = SearchTransitionReadiness;