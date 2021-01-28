const Entity = require('models/entity');
const Category = require('models/category');
const Visualisation = require('models/visualisation');
const EntityFieldEntry = require('models/entityFieldEntry');
const CategoryField = require('models/categoryField');
const readinessHelper = require('./transitionReadinessData');
const DAO = require('services/dao');
const sequelize = require('services/sequelize');

class VisualisationHelper {
  constructor(entityId, req) {
    this.entityId = entityId;
    this.req = req;
    this.entityVisualisations = this.constructEntityVisualisations();
  }

  async canAccessProject(dao, projectUid) {
    const projects = await dao.getAllData(this.req.user.id, {
      uid: [ projectUid ]
    });

    return projects.length;
  }

  async getProjectAndMilestones(dao, projectUid) {
    const projects = await dao.getAllData(undefined, {
      uid: projectUid
    });

    this.mapProjectFields(projects[0])

    return projects[0];
  }

  mapProjectFields(project) {
    project.name = `${project.departmentName} - ${project.title}`;

    project.projectFieldEntries.forEach(projectFieldEntry => {
      project[projectFieldEntry.projectField.name] = projectFieldEntry.value
    });
  }

  mapMilestoneFields(milestone, project) {
    milestone.name = milestone.description;
    milestone.hmgConfidence = project.hmgConfidence;

    milestone.milestoneFieldEntries.forEach(milestoneFieldEntry => {
      if (milestone.milestoneField.name === "category") {
        milestone.categoryName = milestoneFieldEntry.value
      } else {
        milestone[milestoneFieldEntry.milestoneField.name] = milestoneFieldEntry.value
      }
    });
  }

  async getParentEntity(id) {
    return Entity.findOne({
      where: {
        id
      },
    });
  }

  async constructEntityVisualisations() {
    if (!this.entityId) {
      throw new Error('entityId must be included in function call');
    }

    const entityVisualisations = await Entity.findOne({
      include: [{
        model: Visualisation,
      },
      {
        model: Category,
      },
      {
        attributes: ['id'],
        model: Entity,
        as: 'parents'
      },
      {
        seperate: true,
        model: EntityFieldEntry,
        include: {
          attributes: ['name'],
          model: CategoryField,
          where: { isActive: true }
        }
      }],
      where: { id: this.entityId }
    })

    if (entityVisualisations.entityFieldEntries) {
      entityVisualisations.entityFieldEntries.forEach(entityFieldEntry => {
        entityVisualisations[entityFieldEntry.categoryField.name] = entityFieldEntry.value;
      }, {});
      delete entityVisualisations.entityFieldEntries;
    }

    if (entityVisualisations.category.name.match(/^(Project|Milestone)$/)) {
      let publicId = entityVisualisations.publicId;

      if (entityVisualisations.category.name === 'Milestone') {
        const parentEntity = await this.getParentEntity(entityVisualisations.parents[0].id);
        publicId = parentEntity.publicId
      }

      const dao = new DAO({
        sequelize: sequelize
      });

      entityVisualisations.project = await this.getProjectAndMilestones(dao, publicId)
      entityVisualisations.canViewProject = await this.canAccessProject(dao, publicId)

      if (entityVisualisations.category.name === 'Milestone') {
        const milestone = entityVisualisations.project.milestones.find(milestone => milestone.uid === entityVisualisations.publicId)
        this.mapMilestoneFields(milestone, entityVisualisations.project)
        entityVisualisations.milestone = milestone;
      }
    }

    return entityVisualisations;
  }

  async getCategoryVisualisation(category) {
    if (!category) {
      throw new Error('category must be included in function call');
    }

    return category.getVisualisations();
  }

  formatVisualisationData(visualisations) {
    return visualisations.map(({ name, template, categoryVisualisation = {}, entityVisualisation = {} }) => ({
      name, 
      template, 
      config: entityVisualisation.config || categoryVisualisation.config,
      priority: entityVisualisation.priority || null
    }))
  }

  async getVisualisations() {
    const entityVisualisations = await this.entityVisualisations;

    let { visualisations } = entityVisualisations;
    
    // Fallback to default visualisations if not set at the entity level
    if (entityVisualisations && visualisations.length === 0) {
      visualisations = await this.getCategoryVisualisation(entityVisualisations.category);
    }

    entityVisualisations.visualisations = this.formatVisualisationData(visualisations);

    if (entityVisualisations.category.name.match(/^(Measure|Communication)$/)) {
      entityVisualisations.iframeUrl = await readinessHelper.getIframeUrl(this.req, entityVisualisations)
    }

    return entityVisualisations;
  }
}

module.exports = VisualisationHelper