const Page = require('core/pages/page');
const { paths } = require('config');
const sequelize = require('sequelize');
const { filters } = require('helpers');
const moment = require('moment');

class AllData extends Page {
  get url() {
    return paths.allData;
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

  get currentDate() {
    return moment().format()
  }

  getFilter(id, filters) {
    return filters.find(filter => filter.id === id);
  }
}

module.exports = AllData;