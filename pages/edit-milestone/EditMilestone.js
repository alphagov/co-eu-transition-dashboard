const Page = require('core/pages/page');
const { paths } = require('config');
const flash = require('middleware/flash');
const { removeNulls } = require('helpers/utils');
const logger = require('services/logger');
const Milestone = require('models/milestone');
const validation = require('helpers/validation');
const moment = require('moment');
const sequelize = require('services/sequelize');
const authentication = require('services/authentication');

class EditMilestone extends Page {
  get url() {
    return paths.editMilestone;
  }

  get pathToBind() {
    return `${this.url}/:uid/:edit(edit)?/:successful(successful)?`;
  }

  get successfulMode() {
    return this.req.params && this.req.params.successful;
  }

  get signOffMode() {
    return this.req.params && !this.req.params.edit && !this.req.params.successful;
  }

  get editMode() {
    return this.req.params && this.req.params.edit;
  }

  get successfulModeUrl() {
    return `${paths.editMilestone}/${this.req.params.uid}/successful`
  }

  get editModeUrl() {
    return `${paths.editMilestone}/${this.req.params.uid}/edit`
  }

  get signOffUrl() {
    return `${paths.editMilestone}/${this.req.params.uid}`
  }

  next() {
    if(this.editMode) {
      return this.res.redirect(this.successfulModeUrl);
    }

    return this.res.redirect(this.signOffUrl);
  }

  get middleware() {
    return [
      ...authentication.protect(['uploader', 'administrator']),
      flash
    ];
  }

  async getRequest(req, res) {
    if (this.editMode) {
      await this.setData();
    } else {
      this.clearData();
    }

    super.getRequest(req, res);
  }

  async saveFieldToDatabase(milestone) {
    const transaction = await sequelize.transaction();
    const milestoneFields = await Milestone.fieldDefintions();

    try {
      await Milestone.import(milestone, milestoneFields, { transaction });
      await transaction.commit();
      this.next();
    } catch (error) {
      await transaction.rollback();
      logger.error(error);
      this.req.flash(`Error when editing milestone: ${error}`);
      this.res.redirect(this.req.originalUrl);
    }
  }

  async validateMilestone(milestone) {
    const milestoneFields = await Milestone.fieldDefintions();

    milestoneFields.forEach(field => {
      if(field.type === 'date' && milestone[field.name] && moment(milestone[field.name], 'DD/MM/YYYY').isValid()) {
        milestone[field.name] = moment(milestone[field.name], 'DD/MM/YYYY').format();
      }
    })

    const errors = validation.validateItems([milestone], milestoneFields);

    return errors.reduce((message, error) => {
      message += `${error.itemDefinition.importColumnName}: ${error.error}<br>`;
      return message;
    }, '');
  }

  async postRequest(req, res) {
    if(this.editMode) {
      const data = Object.assign({}, removeNulls(req.body));
      this.saveData(data);

      const errors = await this.validateMilestone(data);
      if (errors && errors.length) {
        req.flash(errors);
        return res.redirect(this.req.originalUrl);
      }

      return await this.saveFieldToDatabase(data);
    }

    return res.redirect(this.req.originalUrl);
  }

  async setData() {
    const editingDifferentMilestone = this.data && this.data.uid != this.req.params.uid;
    if (editingDifferentMilestone) {
      this.clearData();
    }

    if(this.data.uid) {
      return;
    }

    const projectMilestone = await this.req.user.getProjectMilestone(this.req.params.uid);
    const milestone = projectMilestone.milestone;

    const milestoneFields = await Milestone.fieldDefintions();

    const data = milestoneFields.reduce((data, field) => {
      if(milestone.fields.get(field.name)) {
        data[field.name] = milestone.fields.get(field.name).value;
      }
      return data;
    }, {})

    this.saveData(data);
  }

  transformDeliveryConfidenceValue(value) {
    switch(value) {
    case 3:
      return `${value} - High confidence`;
    case 2:
      return `${value} - Medium confidence`;
    case 1:
      return `${value} - Low confidence`;
    case 0:
      return `${value} - Very low confidence`;
    default:
      return `No level given`;
    }
  }

  async getProjectMilestone() {
    return await this.req.user.getProjectMilestone(this.req.params.uid);
  }

  async getMilestoneFields() {
    const milestoneFields = await Milestone.fieldDefintions();

    const projects = await this.req.user.getProjects();
    const projectUids = projects.map(project => project.uid);

    const projectUidField = milestoneFields.find(milestoneField => milestoneField.name === 'projectUid');
    projectUidField.config = { options: projectUids };
    projectUidField.type = 'group';

    return milestoneFields;
  }
}

module.exports = EditMilestone;