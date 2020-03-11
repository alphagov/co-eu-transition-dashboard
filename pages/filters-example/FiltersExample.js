const Page = require('core/pages/page');
const { paths } = require('config');
const sequelize = require('sequelize');
// const Projects = require('models/project');
// const Milestone = require('models/milestone');
const { filters } = require('helpers');
const moment = require('moment');

class FiltersExample extends Page {
  get url() {
    return paths.filterExample;
  }

  get schema() {
    return {
      filters: {
        date: ['01/01/2020', '01/01/2021']
      }
    };
  }

  get search() {
    return Object.entries(this.data.filters || {}).reduce((filters, [attirbute, options]) => {
      if (attirbute.includes('date')) {
        const dates = options.map(date => moment(date, 'DD-MM-YYYY').format('YYYY-MM-DD'));
        filters[attirbute] = { [sequelize.Op.between]: dates };
      } else {
        filters[attirbute] = { [sequelize.Op.or]: options };
      }
      return filters;
    }, {});
  }

  async projects() {
    return await this.req.user.getProjects(this.search);
  }

  async filters() {
    return await filters(this.search, this.req.user);
  }
}

module.exports = FiltersExample;