/* eslint-disable no-prototype-builtins */
const Category = require('models/category');
const CategoryField = require('models/categoryField');
const Entity = require('models/entity');
const EntityParent = require('models/entityParent');
const EntityFieldEntry = require('models/entityFieldEntry');
const Project = require('models/project');
const Milestone = require('models/milestone');
const cloneDeep = require('lodash/cloneDeep');
const sequelize = require('services/sequelize');
const DAO = require('services/dao');
const logger = require('services/logger');
const groupBy = require('lodash/groupBy');
const moment = require('moment');
const tableau = require('services/tableau');
const cache = require('services/cache');
const config = require('config');
const uniq = require('lodash/uniq');

const rags = ['red', 'amber', 'yellow', 'green'];

const getIframeUrl = async (req, entity) => {
  if(!entity) {
    return {};
  }

  let workbook = '';
  let view = '';
  let appendUrl = '';

  switch(entity.category.name) {
  case 'Measure':
    workbook = 'Readiness';
    view = entity.groupID;
    if(entity.commentsOnly == 'Yes') {
      workbook = 'Placeholders';
      view = 'Placeholder';
      appendUrl = `?Group%20ID=${entity.groupID}`;
    }
    break;
  case 'Communication':
    workbook = 'Comms';
    view = 'Comms';
    appendUrl = `?Comms%20ID=${entity.commsId}`;
    break;
  case 'Project':
    workbook = 'HMG';
    view = 'Milestones';
    appendUrl = `?Milestone%20-%20uid=${entity.publicId}`;
    break;
  }

  workbook = `${config.services.tableau.prependUrl}${workbook}`;

  let url;
  try {
    url = await tableau.getTableauUrl(req.user, workbook, view);
  } catch (error) {
    logger.error(`Error from tableau: ${error}`);
    return { error: 'Error from tableau' };
  }

  url += appendUrl;

  return { url };
}

const mapProjectToEntity = (milestoneFieldDefinitions, projectFieldDefinitions, entityFieldMap, project) => {
  entityFieldMap.name = `${project.departmentName} - ${project.title}`;
  entityFieldMap.hmgConfidence = project.hmgConfidence;

  project.projectFieldEntries.forEach(projectFieldEntry => {
    entityFieldMap[projectFieldEntry.projectField.name] = projectFieldEntry.value
  });

  entityFieldMap.children = entityFieldMap.children
    .sort((a, b) => {
      return moment(a.date, 'DD/MM/YYYY').valueOf() - moment(b.date, 'DD/MM/YYYY').valueOf();
    });
}

const mapMilestoneToEntity = (milestoneFieldDefinitions, entityFieldMap, project, milestone) => {
  entityFieldMap.name = `${project.departmentName} - ${project.title}`;
  entityFieldMap.hmgConfidence = project.hmgConfidence;

  entityFieldMap.name = milestone.description;
  entityFieldMap.deliveryConfidence = milestone.deliveryConfidence;
  entityFieldMap.date = milestone.date;
  entityFieldMap.complete = milestone.complete;

  milestone.milestoneFieldEntries.forEach(milestoneFieldEntry => {
    // Prevent entity category field overwriting the category
    if (milestoneFieldEntry.milestoneField.name != "category") {
      entityFieldMap[milestoneFieldEntry.milestoneField.name] = milestoneFieldEntry.value
    }
  });
}

const applyRagRollups = (entity) => {
  let color = '';

  if (entity.category) {
    // entity is a project
    if (entity.category.name == 'Project') {
      if (entity.hmgConfidence == 0) {
        color = "red";
      } else if (entity.hmgConfidence == 1) {
        color = "amber";
      } else if (entity.hmgConfidence == 2) {
        color = "yellow";
      } else if (entity.hmgConfidence == 3) {
        color = "green";
      }

      entity.color = color;
      entity.children.forEach(applyRagRollups);
      return color;

    // entity is a milestone
    // do not roll up status to project
    } else if (entity.category.name == 'Milestone') {
      if (entity.deliveryConfidence == 0) {
        color = "red";
      } else if (entity.deliveryConfidence == 1) {
        color = "amber";
      } else if (entity.deliveryConfidence == 2) {
        color = "yellow";
      } else if (entity.deliveryConfidence == 3) {
        color = "green";
      }

      entity.color = color || '';
      return color;
    }
  }

  if(entity.children) {
    const colors = entity.children.map(applyRagRollups);

    color = rags.find(rag => colors.includes(rag));
    entity.color = color || '';

    return color;
  }

  if(entity.hasOwnProperty('redThreshold') &&
    entity.hasOwnProperty('aYThreshold') &&
    entity.hasOwnProperty('greenThreshold') &&
    entity.hasOwnProperty('value')) {
    if (parseInt(entity.value) >= parseInt(entity.greenThreshold)) {
      color = "green";
    } else if (parseInt(entity.value) > parseInt(entity.aYThreshold)) {
      color = "yellow";
    } else if (parseInt(entity.value) > parseInt(entity.redThreshold)) {
      color = "amber";
    } else {
      color = "red";
    }
  }

  entity.color = color;
  return color;
}

const applyActiveItems = (selectedPublicId) => {
  return (entity) => {
    entity.active = false;

    if(entity.children) {
      const isActive = entity.children.find(applyActiveItems(selectedPublicId));
      if(isActive) {
        entity.active = true;
      }
    } else if (entity.publicId === selectedPublicId) {
      entity.active = true;
    }

    return entity.active;
  }
}

const filterEntitiesByCategoryId = (pageUrl, req, entities, categoryIds) => {
  for (var i = entities.length - 1; i >= 0; i--) {
    const entity = entities[i];

    if(entity.children) {
      filterEntitiesByCategoryId(pageUrl,req, entity.children, categoryIds);

      // remove ghost categories
      if(!entity.children.length) {
        // console.log(`Ghost ${entity.publicId}`);
        entities.splice(i, 1);
      }

      continue;
    }

    if(!categoryIds.includes(entity.categoryId)) {
      // console.log(`Category ${entity.publicId} ${entity.categoryId} ${categoryIds}`);
      entities.splice(i, 1);
      continue;
    }

    entity.link = `${pageUrl}/${req.params.theme}/${req.params.statement}/${entity.publicId}`;
  }
}

const mapProjectsToEntities = async (entitiesInHierarchy) => {
  const projectsCategory = await Category.findOne({
    where: { name: 'Project' }
  });

  const milestonesCategory = await Category.findOne({
    where: { name: 'Milestone' }
  });

  if(!projectsCategory || !milestonesCategory) {
    throw new Error('Cannot find projects and milestones category');
  }

  const dao = new DAO({
    sequelize: sequelize
  });
  const milestoneFieldDefinitions = await Milestone.fieldDefinitions();
  const projectFieldDefinitions = await Project.fieldDefinitions();

  let projectUids = [];
  let milestoneUids = [];

  const getProjectUid = (entity) => {
    if(entity.children) {
      for (const child of entity.children) {
        getProjectUid(child);
      }
    }

    if(entity.categoryId === projectsCategory.id) {
      projectUids.push(entity.publicId);
    } else if (entity.categoryId === milestonesCategory.id) {
      milestoneUids.push(entity.publicId);
    }
  }
  for (const child of entitiesInHierarchy.children) {
    getProjectUid(child);
  }

  if(!projectUids.length) {
    return;
  }

  const projects = await dao.getAllData(undefined, {
    uid: projectUids,
    complete: ['Yes', 'No'] // Only include milestones that are completed Yes or No ( dont include decommissioned milestones )
  });

  const mapProjectsToEntites = (entity) => {
    if(entity.children) {
      entity.children.forEach(mapProjectsToEntites);

      // remove projects without milestones
      entity.children = entity.children.filter(entity => {
        const isProject = entity.categoryId === projectsCategory.id;
        if(isProject) {
          if (entity.children && entity.children.length) {
            // console.log(`Adding project ${entity.publicId}`);
            return true;
          } else {
            // console.log(`Removing project ${entity.publicId} due to missing milestones`);
            return false;
          }
        }
        return true;
      });
    }

    if(entity.categoryId === projectsCategory.id) {
      const project = projects.find(project => project.uid === entity.publicId);
      if(project) {
        mapProjectToEntity(milestoneFieldDefinitions, projectFieldDefinitions, entity, project);
        entity.isLastExpandable = true;
      /* 
      } else {
        console.log(`Cannot find Project ${entity.publicId} (either deleted or missing milestones)`);
      */
      }
    } else if (entity.categoryId === milestonesCategory.id) {
      for (const project of projects) {
        const milestone = project.milestones.find(milestone => milestone.uid === entity.publicId);
        if (milestone) {
          mapMilestoneToEntity(milestoneFieldDefinitions, entity, project, milestone);
          break;
        }
      }
    }
  };

  mapProjectsToEntites(entitiesInHierarchy);
  //console.log(JSON.stringify(entitiesInHierarchy, null, '\t'));
}

const sortById = (entity, property) => {
  const childrenGrouped = groupBy(entity.children, child => child[property]);

  if(childrenGrouped) {
    Object.keys(childrenGrouped).forEach(groupKey => {
      let sorted;

      if(property === 'groupID') {
        sorted = childrenGrouped[groupKey]
          .sort((a, b) => moment(b.date).valueOf() - moment(a.date).valueOf());
      } else {
        sorted = childrenGrouped[groupKey]
          .sort((a, b) => a.value - b.value);
      }

      // only show the latest metric details
      entity.children = entity.children.filter(child => {
        if(child[property] && child[property] === groupKey) {
          return child.id === sorted[0].id;
        }
        return true;
      });
    })
  }
};

// We can only append total value of the measure to the description if it is
// the only measure in the group and there are no filter values. This is because
//we cannot programatically decide which numbere to append if the measure is part
// of a group or has multiple values by way of filters
const canAppendValueToDescription = (allEntities, entity) => {
  // only append the value to the description if the unit is none
  const unitIsNone = entity.unit !== 'none';

  // get all measures in group except RAYG rows
  const measuresInGroup = allEntities.filter(allEntity => {
    return allEntity.groupID == entity.groupID && allEntity.filter !== 'RAYG';
  });

  // do any of the measures in this group have a filter
  const doesNotHaveFilter = !measuresInGroup.find(measure => !!measure.filter);

  // ensure there is only one measure in the group
  const metricIds = measuresInGroup.map(measure => measure.metricID);
  const uniqMetricIds = uniq(metricIds);
  const isOnlyMeasureInGroup = uniqMetricIds.length === 1;

  return unitIsNone && doesNotHaveFilter && isOnlyMeasureInGroup;
};

const mapEntityChildren = (allEntities, entity) => {
  const entityFieldMap = cloneDeep(entity.dataValues);
  delete entityFieldMap.children;
  delete entityFieldMap.entityFieldEntries;

  // map entity field values to object
  entity.entityFieldEntries.forEach(entityFieldEntry => {
    entityFieldMap[entityFieldEntry.categoryField.name] = entityFieldEntry.value;
  }, {});

  if(entity.children.length) {
    entityFieldMap.children = [];
    // assign and map children entities
    entity.children.forEach(childEntity => {
      const childEntityWithFieldValues = allEntities.find(entity => entity.id === childEntity.id);
      if(!childEntityWithFieldValues) {
        throw new Error(`Cannot find entity with Public Id ${childEntity.publicId}`);
      }

      const childEntityWithFieldValuesAndMappedChildren = mapEntityChildren(allEntities, childEntityWithFieldValues);
      entityFieldMap.children.push(childEntityWithFieldValuesAndMappedChildren);
    });

    entityFieldMap.children = entityFieldMap.children.filter(entity => {
      // only show measure entities if filter equals RAYG
      const isMeasure = entity.category.name === "Measure";
      if(!isMeasure) {
        return true;
      }
      return entity.filter === 'RAYG';
    });

    // append value to description if a measure and can append value
    entityFieldMap.children = entityFieldMap.children.map(entity => {
      const isMeasure = entity.category.name === "Measure";

      if(isMeasure && canAppendValueToDescription(allEntities, entity)) {
        // if the unit is a percentage append the value to the description as well as a percent symbol, otherwise just append value
        if(entityFieldMap.unit === '%') {
          entity.name = `${entity.groupDescription}: ${entity.value}%`;
        } else {
          entity.name = `${entity.groupDescription}: ${entity.value}`;
        }
      }
      return entity;
    });
  }

  return entityFieldMap;
};

const getAllEntities = async () => {
  const result = await Entity.findAll({
    include: [{
      attributes: ['name'],
      model: Category
    }, {
      model: EntityParent,
      as: 'entityChildren',
      separate: true,
      include: {
        model: Entity,
        as: 'child'
      }
    }, {
      model: EntityParent,
      as: 'entityParents',
      separate: true,
      include: {
        model: Entity,
        as: 'parent'
      }
    }, {
      seperate: true,
      model: EntityFieldEntry,
      include: {
        attributes: ['name'],
        model: CategoryField,
        where: { isActive: true }
      }
    }]
  });

  const allEntities = [];
  result.forEach( entity => {
    let finalEntity = entity;

    finalEntity.children = [];
    if (entity.entityChildren.length) {
      entity.entityChildren.forEach( childEntity => {
        finalEntity.children.push(childEntity.child);
      });
    }
    finalEntity.dataValues.children = finalEntity.children;

    finalEntity.parents = [];
    if (entity.entityParents.length) {
      entity.entityParents.forEach( parentEntity => {
        finalEntity.parents.push(parentEntity.parent);
      });
    }
    finalEntity.dataValues.parents = finalEntity.parents;

    entity.entityFieldEntries.forEach(entityFieldEntry => {
      finalEntity[entityFieldEntry.categoryField.name] = entityFieldEntry.value;
    }, {});

    allEntities.push(finalEntity);
  });

  return allEntities;
}

function whitelistEntityArrayChildren(array,whitelistMap) {
  let resultArray = [];
  for (const entity of array) {
    if (whitelistMap[entity.id]) {
      if (entity.children) {
        entity.children = whitelistEntityArrayChildren(entity.children,whitelistMap);
      }
      resultArray.push(entity);
    }
  }

  return resultArray;
}

const whitelistEntityHeirarchy = async (whitelist,heirarchy) => {
  if (whitelist && whitelist.length) {
    const map = whitelist.reduce( (acc,entity) => {
      acc[entity.id] = entity;
      return acc;
    },{});

    const filteredHeirarchy = whitelistEntityArrayChildren(heirarchy,map);
    return filteredHeirarchy;
  }

  return heirarchy;
}

const createEntityHierarchy = async (entitiesUserCanAccess,category) => {

  let heirarchy = [];

  if(config.features.transitionReadinessCache) {
    const cached = await cache.get(`cache-transition-overview`);
    if(cached) {
      heirarchy = JSON.parse(cached);
    }
  }

  if (!heirarchy.length) {
    const allEntities = await getAllEntities();

    if(!allEntities.length) {
      throw new Error('No entities found in database');
    }

    const topLevelEntites = allEntities.filter(entity => entity.categoryId === category.id)

    heirarchy = [];
    for(const topLevelEntity of topLevelEntites) {
      const entitiesMapped = mapEntityChildren(allEntities, topLevelEntity);
      if(entitiesMapped && entitiesMapped.children && entitiesMapped.children.length) {
        await mapProjectsToEntities(entitiesMapped);
      }
      heirarchy.push(entitiesMapped)
    }

    await cache.set(`cache-transition-overview`, JSON.stringify(heirarchy));
  }

  heirarchy = whitelistEntityHeirarchy(entitiesUserCanAccess,heirarchy);

  return heirarchy;
}

const createEntityHierarchyForTheme = async (entitiesUserCanAccess,topLevelEntityPublicId) => {

  let topLevelEntityMapped;

  if(config.features.transitionReadinessCache) {
    const cached = await cache.get(`cache-transition-${topLevelEntityPublicId}`);
    if(cached) {
      topLevelEntityMapped = JSON.parse(cached);
    }
  }

  if (!topLevelEntityMapped) {
    const allEntities = await getAllEntities();
    if(!allEntities.length) {
      throw new Error('No entities found in database');
    }

    const topLevelEntity = allEntities.find(entity => entity.publicId === topLevelEntityPublicId);
    if(!topLevelEntity) {
      throw new Error(`Cannot find entity with Public Id ${topLevelEntityPublicId}`);
    }

    topLevelEntityMapped = mapEntityChildren(allEntities, topLevelEntity);
    await mapProjectsToEntities(topLevelEntityMapped);

    await cache.set(`cache-transition-${topLevelEntityPublicId}`, JSON.stringify(topLevelEntityMapped));
  }

  const filteredHeirarchy = await whitelistEntityHeirarchy(entitiesUserCanAccess,[topLevelEntityMapped]);
  return filteredHeirarchy[0];
}

const constructTopLevelCategories = async () => {
  const categories = await Category.findAll();

  const measuresCategory = categories.find(category => category.name === 'Measure');
  if(!measuresCategory) {
    throw new Error('Cannot find measures category');
  }

  const communicationCategory = categories.find(category => category.name === 'Communication');
  if(!communicationCategory) {
    return logger.error('Cannot find communication category');
  }

  const projectCategory = categories.find(category => category.name === 'Project');
  if(!projectCategory) {
    throw new Error('Cannot find projectCategory category');
  }

  const milestoneCategory = categories.find(category => category.name === 'Milestone');
  if(!milestoneCategory) {
    throw new Error('Cannot find milestoneCategory category');
  }

  return [{
    name: "Empirical",
    categoryId: measuresCategory.id,
    filterCategoryIds: [measuresCategory.id]
  },{
    name: "Comms",
    categoryId: communicationCategory.id,
    filterCategoryIds: [communicationCategory.id]
  },{
    name: "HMG Delivery",
    categoryId: projectCategory.id,
    filterCategoryIds: [projectCategory.id,milestoneCategory.id]
  }];
}

const applyUIFlags = (entity) => {
  if (entity.children && entity.children.length && !entity.children[0].children) {
    return entity.isLastExpandable = true;
  } else if(entity.children) {
    entity.children.forEach(applyUIFlags);
  }
}

const groupById = (entity) => {
  if(entity.children && entity.children.length && entity.children[0].groupID) {
    sortById(entity, 'groupID');
  } else if(entity.children && entity.children.length && entity.children[0].commsId) {
    sortById(entity, 'commsId');
  } else if(entity.children) {
    entity.children.forEach(groupById);
  }
}

const getSubOutcomeStatementsAndDatas = async (pageUrl, req, topLevelEntity) => {
  let entities = [];

  try {
    if(!topLevelEntity.children) {
      return entities;
    }

    entities = await constructTopLevelCategories();

    // sort all entities into respective categories i.e. Empirical, Comms, HMG Delivery
    entities.forEach(entity => {
      const topLevelEntityClone = cloneDeep(topLevelEntity);
      filterEntitiesByCategoryId(pageUrl, req, topLevelEntityClone.children, entity.filterCategoryIds);
      entity.children = topLevelEntityClone.children;
    });

    // remove any categories without children
    entities = entities.filter(data => data.children.length);

    entities.forEach(entity => {
      applyUIFlags(entity);
      groupById(entity);
      applyRagRollups(entity);

      applyActiveItems(req.params.selectedPublicId)(entity);
    });
  } catch (error) {
    logger.error(error);
  }

  return entities;
}

const getThemeEntities = async (entitiesUserCanAccess) => {
  const themeCategory = await Category.findOne({
    where: { name: 'Theme' }
  });

  // No need to await, just return the promise
  return createEntityHierarchy(entitiesUserCanAccess,themeCategory);
}

const getTopLevelOutcomeStatements = async (pageUrl, req, topLevelEntity) => {
  const statementCategory = await Category.findOne({
    where: { name: 'Statement' }
  });

  let entities = topLevelEntity.children;

  try {
    const filterChildren = (entities = []) => {
      for (var i = entities.length - 1; i >= 0; i--) {
        const entity = entities[i];

        if(entity.children) {
          filterChildren(entity.children);

          if(!entity.children.length) {
            // console.log(`Removing ${entity.publicId}`);
            entities.splice(i, 1);
          }
          continue;
        }

        if(entity.categoryId === statementCategory.id) {
          // console.log(`Removing ${entity.publicId}`);
          entities.splice(i, 1);
        }
      }
    };

    entities.forEach(entity => {
      if(entity.children) {
        filterChildren(entity.children);
      }
    });

    entities = entities.filter(entity => {
      const hasChildren = entity.children && entity.children.length;
      const hasOnlyParentOrLess = entity.parents.length <= 1;
      // console.log(`Removing ${entity.publicId}`);
      return hasChildren && hasOnlyParentOrLess;
    });

    entities.forEach(entity => {
      groupById(entity);
      applyRagRollups(entity);

      entity.link = `${pageUrl}/${req.params.theme}/${entity.publicId}`;

      delete entity.children;
      // console.log(`Removing ${entity.publicId} children`);


      applyActiveItems(req.params.statement)(entity);
    });

  } catch (error) {
    logger.error(error);
  }

  return entities;
}

const findSelected = (item, entity) => {
  if(item) {
    return item;
  }
  if(entity.active && entity.children) {
    return entity.children.reduce(findSelected, item);
  } else if(entity.active) {
    return entity;
  }
  return item;
}

const themeDetail = async (entitiesUserCanAccess, pageUrl, req) => {
  const theme = await createEntityHierarchyForTheme(entitiesUserCanAccess,req.params.theme);
  if (!theme) {
    return;
  }
  const topLevelOutcomeStatements = await getTopLevelOutcomeStatements(pageUrl, req, cloneDeep(theme));
  if (!topLevelOutcomeStatements) {
    return;
  }

  let subOutcomeStatementsAndDatas = [];
  if (req.params.statement) {
    const topLevelSelectedStatment = cloneDeep(theme).children
      .find(entity => entity.publicId === req.params.statement);
    if(!topLevelSelectedStatment) {
      throw new Error(`Cannot find entity with Public Id ${req.params.statement}`);
    }
    subOutcomeStatementsAndDatas = await getSubOutcomeStatementsAndDatas(pageUrl, req, topLevelSelectedStatment);
  }

  // set rag information on theme
  const outcomeColors = topLevelOutcomeStatements.map(c => c.color);
  theme.color = rags.find(rag => outcomeColors.includes(rag));

  const selected = subOutcomeStatementsAndDatas.reduce(findSelected, false);
  const iframeUrl = await getIframeUrl(req, selected);

  return {
    iframeUrl,
    theme,
    topLevelOutcomeStatements,
    subOutcomeStatementsAndDatas
  }
}

const findEntity = (item, entity) => {
  if(item.found) {
    return item;
  }
  if(entity.publicId === item.publicId) {
    entity.found = true;
    return entity;
  } else if(entity.children) {
    return entity.children.reduce(findEntity, item);
  }
  return item;
}


const findTopLevelOutcomeStatementFromEntity = (statementCategory, allThemes, publicId) => {
  const entity = allThemes.reduce(findEntity, { publicId, found: false });

  if (entity.parents) {
    const parent = entity.parents.find(parent => parent.categoryId == statementCategory.id);
    if(!parent) {
      return entity;
    } else {
      return findTopLevelOutcomeStatementFromEntity(statementCategory, allThemes, parent.publicId)
    }
  }
};

const overview = async (entitiesUserCanAccess, transitionReadinessThemeDetailLink, headlinePublicIds) => {
  const themeCategory = await Category.findOne({
    where: { name: 'Theme' }
  });

  const statementCategory = await Category.findOne({
    where: { name: 'Statement' }
  });

  const allThemes = await createEntityHierarchy(entitiesUserCanAccess,themeCategory);

  allThemes.forEach(entity => {
    groupById(entity);
    applyRagRollups(entity);
  });

  // set headline Entity link
  let headlineEntites = [];
  for (const publicId of headlinePublicIds) {
    const entity = allThemes.reduce(findEntity, { publicId, found: false });

    if (entity.found) {
      const statement = findTopLevelOutcomeStatementFromEntity(statementCategory, allThemes, publicId);
      const theme = statement.parents.find(parent => parent.categoryId == themeCategory.id);
      const themeDetail = allThemes.reduce(findEntity, { publicId: theme.publicId, found: false });

      entity.theme = themeDetail.name;
      entity.link = `${transitionReadinessThemeDetailLink}/${theme.publicId}/${statement.publicId}/${entity.publicId}`;

      headlineEntites.push(entity);
    }
  }

  allThemes.forEach(entity => {
    delete entity.entityChildren;
    delete entity.entityParents;
    delete entity.children;
  });

  return {
    allThemes,
    headlineEntites
  }
}



module.exports = {
  themeDetail,
  overview,
  getThemeEntities
};
