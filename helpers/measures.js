const Category = require('models/category');
const CategoryField = require('models/categoryField');
const EntityFieldEntry = require('models/entityFieldEntry');
const logger = require('services/logger');
const uniqWith = require('lodash/uniqWith');
const { buildDateString } = require('helpers/utils');
const moment = require('moment');
const validation = require('helpers/validation');
const parse = require('helpers/parse');
const filterMetricsHelper = require('helpers/filterMetrics');
const rayg = require('helpers/rayg');
const Entity = require('models/entity');
const transitionReadinessData = require('helpers/transitionReadinessData');
const { paths } = require('config');
const groupBy = require('lodash/groupBy');
const get = require('lodash/get');
const uniq = require('lodash/uniq');

const applyLabelToEntities = (entities) => {
  entities.forEach(entity => {
    if (entity.filter && entity.filterValue) {
      entity.label = `${entity.filter} : ${entity.filterValue}`
    }

    if (entity.filter2 && entity.filterValue2) {
      entity.label2 = `${entity.filter2} : ${entity.filterValue2}`
    }
  })
}

const calculateUiInputs = (measureEntities) => {
  return uniqWith(
    measureEntities,
    (locationA, locationB) => {
      if (locationA.filter && locationA.filter2) {
        return locationA.filterValue === locationB.filterValue && locationA.filterValue2 === locationB.filterValue2
      } else if (locationA.filter) {
        return locationA.filterValue === locationB.filterValue
      } else {
        return locationA.metricID
      }
    }
  );
}

const getEntityFields = async (entityId) => {
  const entityFieldEntries = await EntityFieldEntry.findAll({
    where: { entity_id: entityId },
    include: CategoryField
  });

  if (!entityFieldEntries) {
    logger.error(`EntityFieldEntry export, error finding entityFieldEntries`);
    throw new Error(`EntityFieldEntry export, error finding entityFieldEntries`);
  }

  return entityFieldEntries;
}

const getCategory = async (name) => {
  const category = await Category.findOne({
    where: { name }
  });

  if (!category) {
    logger.error(`Category export, error finding Measure category`);
    throw new Error(`Category export, error finding Measure category`);
  }

  return category;
}

const getMeasureEntitiesFromGroup = (groupEntities, metricId) => {
  const measureEntities = groupEntities.filter(entity => entity.metricID === metricId);
  const sortedEntities = measureEntities.sort((a, b) => moment(a.date, 'DD/MM/YYYY').valueOf() - moment(b.date, 'DD/MM/YYYY').valueOf());
  return sortedEntities;
}

const getMaxUpdateAtForMeasures = (measures) => {
  let maxMeasureUpdatedAt;
  measures.forEach(measure => {
    const entityUpdatedAt = (measure.updatedAt) ? moment(measure.updatedAt) : moment(measure.createdAt);
    maxMeasureUpdatedAt = (maxMeasureUpdatedAt && maxMeasureUpdatedAt.isSameOrAfter(entityUpdatedAt)) ? maxMeasureUpdatedAt : entityUpdatedAt;
  })
  return maxMeasureUpdatedAt;
}

const validateFormData = (formData, measuresEntities = []) => {
  const errors = [];
  if (!moment(buildDateString(formData), 'YYYY-MM-DD').isValid()) {
    errors.push("Invalid date");
  }

  const isDateDuplicated = measuresEntities.some(entity => moment(buildDateString(formData), 'YYYY-MM-DD').isSame(moment(entity.date, 'DD/MM/YYYY')))

  if (isDateDuplicated) {
    errors.push("Date already exists");
  }

  if (!formData.entities) {
    errors.push("Missing entity values");
  }

  if (formData.entities) {
    const submittedEntityId = Object.keys(formData.entities);

    submittedEntityId.forEach(entityId => {
      const entityValue = formData.entities[entityId]
      if (entityValue.length === 0 || isNaN(entityValue)) {
        errors.push("Invalid field value");
      }
    })

    if (Object.keys(formData.entities).length === 0) {
      errors.push("You must submit at least one value");
    }
  }

  return errors;
}

const validateEntities = async (entities) => {
  const categoryFields = await Category.fieldDefinitions('Measure');
  const parsedEntities = parse.parseItems(entities, categoryFields, true);

  const errors = [];
  if (!parsedEntities || !parsedEntities.length) {
    errors.push({ error: 'No entities found' });
  }

  const entityErrors = validation.validateItems(parsedEntities, categoryFields);
  errors.push(...entityErrors)

  return {
    errors,
    parsedEntities
  }
}

const getMeasureEntities = async({ measureCategory, themeCategory, where, user }) => {
  where = { categoryId: measureCategory.id, ...where };

  let measureEntities = await Entity.findAll({
    where,
    include: [{
      separate: true,
      model: EntityFieldEntry,
      include: CategoryField
    },{
      // get direct parent of measure i.e. outcome statement
      model: Entity,
      as: 'parents',
      include: [{
        model: Category
      }, {
        // get direct parents of outcome statement i.e. theme ( and possibly another outcome statement )
        model: Entity,
        as: 'parents',
        include: [{
          separate: true,
          model: EntityFieldEntry,
          include: CategoryField
        }, {
          model: Category
        }]
      }]
    }]
  });

  if (user) {
    measureEntities = await filterMetricsHelper.filterMetrics(user, measureEntities);
  }

  return measureEntities.map(entity => {
    const theme = get(entity, 'parents[0].parents').find(parentEntity => {
      return parentEntity.categoryId === themeCategory.id;
    });

    const themeName = theme.entityFieldEntries.find(fieldEntry => {
      return fieldEntry.categoryField.name === 'name';
    });
    const entityMapped = {
      id: entity.id,
      publicId: entity.publicId,
      theme: themeName.value,
      updatedAt: entity.updated_at,
      createdAt: entity.created_at,
      updateDueOn: entity.updateDueOn
    };

    entity.entityFieldEntries.map(entityfieldEntry => {
      entityMapped[entityfieldEntry.categoryField.name] = entityfieldEntry.value;
    });
    return entityMapped;
  });
}

const groupMeasures = (measures) => {
  const measureEntitiesGrouped = groupBy(measures, measure => {
    return measure.groupID;
  });  
  const measureGroups = Object.values(measureEntitiesGrouped).reduce((measureGroups, group) => {
    const groupMeasure = group.find(measure => measure.filter === 'RAYG');
    // if no RAYG row then ignore as its not shown on dashboard
    if(!groupMeasure) {
      return measureGroups;
    }
    
    const nonRaygRows = group.filter(measure => measure.filter !== 'RAYG');

    const measuresGroupedByMetricId = groupBy(nonRaygRows, entity => entity.metricID);
    groupMeasure.children = Object.values(measuresGroupedByMetricId).map(measures => {
      const maxMeasureUpdatedAt = getMaxUpdateAtForMeasures(measures);
      const measuresSortedByDate = measures.sort((a, b) => moment(b.date, 'DD/MM/YYYY').valueOf() - moment(a.date, 'DD/MM/YYYY').valueOf());
      measuresSortedByDate[0].colour = rayg.getRaygColour(measuresSortedByDate[0]);
      measuresSortedByDate[0].updatedAt = maxMeasureUpdatedAt
      measuresSortedByDate[0].updatedAtDate = (maxMeasureUpdatedAt) ? maxMeasureUpdatedAt.format('DD/MM/YYYY'): null;
      measuresSortedByDate[0].updateDueOn = (measures.length > 0 && measures[0].updateDueOn) ? measures[0].updateDueOn : null;
      return measuresSortedByDate[0];
    });

    const maxGroupUpdatedAt = getMaxUpdateAtForMeasures(groupMeasure.children);
    groupMeasure.colour = rayg.getRaygColour(groupMeasure);
    groupMeasure.updatedAt = (maxGroupUpdatedAt) ? maxGroupUpdatedAt.format('DD/MM/YYYY'): null;
    measureGroups.push(groupMeasure);
    return measureGroups;
  }, []);
  return measureGroups;
}

const getMeasuresWhichUserHasAccess = async (entitiesUserCanAccess) => {
  const measureCategory  = await getCategory('Measure');
  const projectCategory  = await getCategory('Project');

  const allThemes = await transitionReadinessData.getThemesHierarchy(entitiesUserCanAccess);

  const findEntities = (allEntites, entity) => {
    if([projectCategory.id, measureCategory.id].includes(entity.categoryId)) {
      allEntites.push(entity.publicId);
    }
    if(entity.children){
      return entity.children.reduce(findEntities, allEntites);
    }
    return allEntites;
  };
  const measuresPublicId = uniq(allThemes.reduce(findEntities, []));
  const measuresWithLink = await transitionReadinessData.measuresWithLink(allThemes, measuresPublicId, paths.transitionReadinessThemeDetail)
  let tags = measuresWithLink.reduce((tags, measure) => {
    if(!measure.tags) {
      return tags;
    }
    return [...tags, ...measure.tags.map(tag => tag.name)];
  }, []);
  tags = uniq(tags);

  return {
    tags,
    measures: measuresWithLink,
    themes: allThemes,
    colors: [{ color: 'red', definition: 'High risk' }, { color: 'amber', definition: 'Medium risk' }, { color: 'yellow', definition: 'Low risk' }, { color: 'green', definition: 'Minimal/No risk' }]
  };
}

module.exports = {
  applyLabelToEntities,
  calculateUiInputs,
  getEntityFields,
  getCategory,
  getMaxUpdateAtForMeasures,
  getMeasureEntitiesFromGroup,
  getMeasureEntities,
  getMeasuresWhichUserHasAccess,
  groupMeasures,
  validateFormData,
  validateEntities
};
