const Page = require('core/pages/page');
const { paths } = require('config');
const sequelize = require('sequelize');
const Project = require('models/project');
const Milestone = require('models/milestone');
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
    const groupedFilters = { project: {}, milestone: {}, projectField: [], milestoneField: {} };

    const filters = Object.entries(this.data.filters || {}).reduce((filters, [attirbute, options]) => {
      if (attirbute.includes('date')) {
        const dates = options.map(date => moment(date, 'DD-MM-YYYY').format('YYYY-MM-DD'));
        filters[attirbute] = { [sequelize.Op.between]: dates };
      } else {
        filters[attirbute] = { [sequelize.Op.or]: options };
      }
      return filters;
    }, {});

    for (const searchKey of Object.keys(filters)) {
      const searchItem = filters[searchKey];

      if(Object.keys(Project.rawAttributes).includes(searchKey)) {
        groupedFilters.project[searchKey] = searchItem;
      } else if(Object.keys(Milestone.rawAttributes).includes(searchKey)) {
        groupedFilters.milestone[searchKey] = searchItem;
      } else if(searchKey.includes('ProjectFieldEntryFilter')) {
        const filter = JSON.parse(searchKey);
        const options = searchItem;

        const likeString = [];
        for(const option of options[sequelize.Op.or]) {
          likeString.push(`\`${filter.path}\`.\`value\` LIKE "%${option}%"`)
        }

        const string = `\`${filter.path}\`.\`project_field_id\`=${filter.id} AND ${likeString.join(' OR ')}`;

        groupedFilters.projectField.push(sequelize.literal(string));
      }
    }

    return groupedFilters;
  }

  async projects() {
    return await this.req.user.getProjects(this.search);
  }

  async filters() {
    return await filters(this.search, this.req.user);
  }
}

module.exports = FiltersExample;