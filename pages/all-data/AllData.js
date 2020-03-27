const Page = require('core/pages/page');
const { paths } = require('config');
const { getFilters } = require('helpers/filters');
const moment = require('moment');
const { removeNulls } = require('helpers/utils');

class AllData extends Page {
  get url() {
    return paths.allData;
  }

  get schema() {
    return { filters: {} };
  }

  applyFormatting(attribute, value) {
    const getConfidenceDescription = (type) => {
      switch(value) {
        case 3:
          return `Very high ${type}`;
        case 2:
          return `High ${type}`;
        case 1:
          return `Medium ${type}`;
        case 0:
          return `Low ${type}`;
        default:
          return `No ${type} level given`;
      }
    };

    const getImpactDescription = (type) => {
      switch(value) {
        case 0:
          return `Very high ${type}`;
        case 1:
          return `High ${type}`;
        case 2:
          return `Medium ${type}`;
        case 3:
          return `Low ${type}`;
        default:
          return `No ${type} level given`;
      }
    };

    switch(attribute.id) {
      case 'impact':
        return `${value} - ${getImpactDescription('impact')}`;
      case 'hmgConfidence':
      case 'citizenReadiness':
      case 'businessReadiness':
      case 'euStateConfidence':
        return `${value} - ${getConfidenceDescription('confidence')}`;
    }

    return value;
  }

  formatDate(date) {
    return moment(date, 'DD/MM/YYYY').format("Do MMMM YYYY");
  }

  get filtersFields() {
    return ['departmentName', 'title', 'deliveryTheme', 'impact', 'hmgConfidence', 'citizenReadiness', 'businessReadiness', 'euStateConfidence', 'progressStatus'];
  }

  get tableFields() {
    if(this.res.locals.departmentalView){
      return ['uid', 'title', 'impact', 'hmgConfidence', 'citizenReadiness', 'businessReadiness', 'euStateConfidence'];
    }
    return ['uid', 'title', 'departmentName', 'impact', 'hmgConfidence', 'citizenReadiness', 'businessReadiness', 'euStateConfidence'];
  }

  get milestoneTableFields() {
    return ['uid', 'description', 'date', 'comments'];
  }

  async projects() {
    return await this.req.user.getProjects(this.data.filters);
  }

  async filters() {
    return await getFilters(this.data.filters, this.req.user);
  }

  get currentDate() {
    return moment().format();
  }

  async postRequest(req, res) {
    if(req.body.filterId) {
      let filters = this.data.filters;
      const filterId = req.body.filterId;
      const optionValue = req.body.optionValue;

      if (!optionValue) {
        delete filters[filterId];
      } else {
        for (var i = filters[filterId].length - 1; i >= 0; i--) {
          if (filters[filterId][i] == optionValue) filters[filterId].splice(i, 1);
        }
      }

      this.saveData(removeNulls({ filters }));
      res.redirect(this.url);
    } else {
      super.postRequest(req, res);
    }
  }
}

module.exports = AllData;