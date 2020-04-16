const Page = require('core/pages/page');
const { paths } = require('config');
const Project = require('models/project');
const Milestone = require('models/milestone');
const sequelize = require('services/sequelize');
const fileUpload = require('express-fileupload');
const flash = require('middleware/flash');
const authentication = require('services/authentication');
const logger = require('services/logger');
const validation = require('helpers/validation');
const parse = require('helpers/parse');
const { removeNulls } = require('helpers/utils');
const pick = require('lodash/pick');
const config = require('config');
const BulkImport = require('models/bulkImport');

class Import extends Page {
  get url() {
    return paths.admin.import;
  }

  get middleware() {
    return [
      ...authentication.protect(['admin']),
      fileUpload({ safeFileNames: true }),
      flash
    ];
  }

  async import(projects, milestones) {
    const projectFields = await Project.fieldDefintions();
    const milestoneFields = await Milestone.fieldDefintions();

    const transaction = await sequelize.transaction();
    try {
      for(const project of projects) {
        await Project.import(project, projectFields, { transaction });
      }
      for(const milestone of milestones) {
        await Milestone.import(milestone, milestoneFields, { transaction });
      }
      await transaction.commit();

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  validateItems(items, parsedItems, fields) {
    const requiredColumns = pick(fields, ['importColumnName']);
    const columnErrors = validation.validateColumns(Object.keys(items[0]), requiredColumns);

    const itemErrors = validation.validateItems(parsedItems, fields);

    return [columnErrors, itemErrors];
  }

  async validateImport(activeImport) {
    const projectFields = await Project.fieldDefintions();
    const milestoneFields = await Milestone.fieldDefintions();

    const parsedProjects = parse.parseItems(activeImport.data.projects, projectFields);
    const parsedMilestones = parse.parseItems(activeImport.data.milestones, milestoneFields);

    const [
      projectColumnErrors,
      projectErrors
    ] = this.validateItems(activeImport.data.projects, parsedProjects, projectFields);

    // Ensure that milestone project_uid matches a project uid
    const projectUidField = milestoneFields.find(milestoneField => milestoneField.name === 'projectUid');
    projectUidField.config = { options: pick(parsedProjects, ['uid']) };
    projectUidField.type = 'group';

    const [
      milestoneColumnErrors,
      milestoneErrors
    ] = this.validateItems(activeImport.data.milestones, parsedMilestones, milestoneFields);

    const errors = { projectErrors, milestoneErrors, projectColumnErrors, milestoneColumnErrors };

    return {
      errors: removeNulls(errors, 1),
      projects: parsedProjects,
      milestones: parsedMilestones,
      importId: activeImport.id
    };
  }

  async finaliseImport(importId) {
    const activeImport = await BulkImport.findOne({
      where: {
        userId: this.req.user.id,
        id: importId
      },
      raw: true
    });

    if (!activeImport) {
      return this.res.redirect(config.paths.admin.upload);
    }

    const { errors, projects, milestones } = await this.validateImport(activeImport);
    if (Object.keys(errors).length) {
      return this.res.redirect(this.url);
    }

    try {
      await this.import(projects, milestones);
      await this.removeTemporaryBulkImport(importId);
    } catch (error) {
      logger.error(error);
      this.req.flash('Failed to import data');
      return this.res.redirect(this.url);
    }

    return this.res.redirect(config.paths.admin.upload);
  }

  async removeTemporaryBulkImport(importId) {
    await BulkImport.destroy({
      where: {
        userId: this.req.user.id,
        id: importId
      }
    });
  }


  async cancelImport(importId) {
    await this.removeTemporaryBulkImport(importId);
    return this.res.redirect(config.paths.admin.upload);
  }

  async postRequest(req, res) {
    if (req.body.cancel && req.body.importId) {
      return await this.cancelImport(req.body.importId);
    }

    if (req.body.import && req.body.importId) {
      return await this.finaliseImport(req.body.importId);
    }

    res.redirect(this.url);
  }

  async getRequest(req, res) {
    const activeImport = await BulkImport.findOne({
      where: {
        userId: req.user.id
      },
      raw: true
    });

    if (!activeImport) {
      return res.redirect(config.paths.admin.upload);
    }

    const { errors, projects, milestones, importId } = await this.validateImport(activeImport);

    return res.render(this.template,
      Object.assign(this.locals, {
        errors,
        projects,
        milestones,
        importId
      })
    );
  }
}

module.exports = Import;