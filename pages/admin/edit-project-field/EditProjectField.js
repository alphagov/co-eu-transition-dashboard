const Page = require('core/pages/page');
const { paths } = require('config');
const FieldEntryGroup = require('models/fieldEntryGroup');
const ProjectField = require('models/projectField');
const flash = require('middleware/flash');
const authentication = require('services/authentication');
const logger = require('services/logger');
const { camelCase, removeNulls } = require('helpers/utils');

class EditProjectField extends Page {
  get url() {
    return paths.admin.projectField;
  }

  get middleware() {
    return [
      ...authentication.protect(['admin']),
      flash
    ];
  }

  get pathToBind() {
    return `${this.url}/:id(\\d+)?/:summary(summary)?/:successful(successful)?`;
  }

  get editMode() {
    return this.req.params && this.req.params.id;
  }

  get summaryMode() {
    return this.req.params && this.req.params.summary;
  }

  get successfulMode() {
    return this.req.params && this.req.params.successful;
  }

  async getRequest(req, res) {
    if (this.summaryMode || this.successfulMode) {
      // there should be an id set now
      if (!this.data.id) {
        return this.res.redirect(paths.admin.projectFieldList);
      }
    } else if (!this.successfulMode) {
      await this.setData();
    }

    super.getRequest(req, res);

    if (this.successfulMode) {
      this.clearData();
    }
  }

  get editUrl() {
    let url = this.url;

    if(this.editMode) {
      url += `/${this.req.params.id}`;
    }

    return url;
  }

  next() {
    let url = this.url;

    if(this.editMode) {
      url += `/${this.req.params.id}`;
    }

    if(this.summaryMode) {
      return this.res.redirect(`${url}/successful`);
    }

    return this.res.redirect(`${url}/summary`);
  }

  async saveFieldToDatabase() {
    const field = this.data;

    if (field.id === 'temp') {
      delete field.id;
    }

    if(!field.name && field.displayName) {
      field.name = camelCase(field.displayName.replace(/[^A-Za-z0-9_]/gm, ''));
    }

    try {
      await ProjectField.upsert(field);
      this.next();
    } catch (error) {
      logger.error(error);
      this.req.flash(`Error when creating / editing field: ${error}`);
      this.res.redirect(this.req.originalUrl);
    }
  }

  isValid(body) {
    let isValidGroup = true;
    if (body.type === 'group') {
      body.config = removeNulls(body.config);
      isValidGroup = body.config && body.config.options && body.config.options.length > 0;
    }

    const hasDisplayName = body.displayName && String(body.displayName).trim().length > 0;
    const hasImportColumnName = body.importColumnName && String(body.importColumnName).trim().length > 0;
    const hasDescription = body.description && String(body.description).trim().length > 0;

    return isValidGroup && hasDisplayName && hasImportColumnName && hasDescription;
  }

  async postRequest(req, res) {
    if(this.summaryMode) {
      return await this.saveFieldToDatabase();
    }
    if (!this.isValid(req.body)) {
      req.flash('You must fill in all the fields before you can review the field details');
      this.saveData(removeNulls(req.body));
      return res.redirect(this.req.originalUrl);
    } else {
      super.postRequest(req);
    }
  }

  async setData() {
    if (this.editMode) {
      const noIdSet = !this.data.id;
      const differentId = this.data.id != this.req.params.id;
      if(noIdSet || differentId) {
        const data = await ProjectField.findOne({
          where: {
            id: this.req.params.id
          }
        });

        if(data.config && data.config.options) {
          data.groupItems = data.config.options;
        }

        this.saveData(data);
      }
    } else if (this.data.id !== 'temp') {
      return this.clearData();
    }
  }

  async getProjectGroups() {
    return await FieldEntryGroup.findAll();
  }
}

module.exports = EditProjectField;