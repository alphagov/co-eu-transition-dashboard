const Page = require('core/pages/page');
const { paths } = require('config');
const sequelize = require('sequelize');
const Projects = require('models/project');
const Milestones = require('models/milestone');
const { filters } = require('helpers');
const moment = require('moment');

class AllData extends Page {
  get url() {
    return paths.allData;
  }

  get schema() {
    return {
      filters: {
        projects: [],
        milestones: {
          due_date: ['01/01/2020', '01/01/2021']
        }
      }
    };
  }

  get search() {
    const getFilters = type => {
      return Object.entries(this.data.filters[type] || {}).reduce((filters, [attirbute, options]) => {
        if (attirbute.includes('date')) {
          const dates = options.map(date => moment(date, 'DD-MM-YYYY').format('YYYY-MM-DD'));
          filters[attirbute] = { [sequelize.Op.between]: dates };
        } else {
          filters[attirbute] = { [sequelize.Op.or]: options };
        }
        return filters;
      }, {});
    }

    return {
      projects: getFilters('projects'),
      milestones: getFilters('milestones')
    };
  }

  async projects() {
    return await Projects.findAll({
      where: this.search.projects,
      include: [{
        model: Milestones,
        where: this.search.milestones
      }]
    });
  }

  async filters() {
    return await filters(this.search);
  }

  get currentDate() {
    return moment().format()
  }

  getFilter(id, filters) {
    return filters.find(filter => filter.id === id);
  }
}

module.exports = AllData;