const Entity = require('models/entity');
const Category = require('models/category');
const Visualisation = require('models/visualisation');
const EntityFieldEntry = require('models/entityFieldEntry');
const CategoryField = require('models/categoryField');
const readinessHelper = require('./transitionReadinessData');

class VisualisationHelper {
  constructor(entityId, req) {
    this.entityId = entityId;
    this.req = req;
    this.entityVisualisations = this.constructEntityVisualisations();
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