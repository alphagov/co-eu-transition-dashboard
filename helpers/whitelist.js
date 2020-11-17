const Entity = require('models/entity');
const EntityFieldEntry = require('models/entityFieldEntry');
const Category = require('models/category');
const CategoryField = require('models/categoryField');
const transitionReadinessData = require('helpers/transitionReadinessData');

function getFlatEntityTree(entity,allEntityMap) {
  let entities = [entity];

  entity.children.forEach( child => {
    const childEntity = allEntityMap[child.id];
    entities = entities.concat(getFlatEntityTree(childEntity,allEntityMap));
  });

  return entities;
}

async function getEntityMap() {
  const allEntities = await Entity.findAll({
    attributes: ['publicId', 'id'],
    include: {
      attributes: ['publicId', 'id'],
      model: Entity,
      as: 'children'
    }
  });

  return allEntities.reduce( (acc,entity) => {
    acc[entity.id] = entity;
    return acc;
  },{});
}

async function getProjectEntities(projectUids) {
  return Entity.findAll({
    attributes: ['publicId', 'id'],
      where: {
        publicId: projectUids
      },
      include: {
        model: Category,
        where: {
          name: 'Project'
        }
      }
  });
}

async function getMilestoneEntities(milestoneUids) {
  return Entity.findAll({
    attributes: ['publicId', 'id'],
      where: {
        publicId: milestoneUids
      },
      include: {
        model: Category,
        where: {
          name: 'Milestone'
        }
      }
  });
}

async function getMetricEntities(metricIds) {
  return Entity.findAll({
    attributes: ['publicId', 'id'],
    include: {
      model: EntityFieldEntry,
      where: {
        value: metricIds,
        categoryFieldId: [13,41]
      },
      include: {
        model: CategoryField,
        where: {
          name: ['metricID','groupID']
        }
      }
    }
  });
}

async function generateTreeWhitelist(treeWhitelist,treeBlacklist) {
  const entityMap = await getEntityMap();

  let whitelist = [];
  treeWhitelist.forEach( (entity) => {
    whitelist = whitelist.concat(getFlatEntityTree(entityMap[entity.id],entityMap));
  });

  let blacklist = [];
  treeBlacklist.forEach( (entity) => {
    blacklist = blacklist.concat(getFlatEntityTree(entityMap[entity.id],entityMap));
  });

  const blacklistMap = blacklist.reduce( (acc,entry) => {
    acc[entry.id] = entry;
    return acc;
  },{});

  return whitelist.filter( entry => !blacklistMap[entry.id]);
}

module.exports = {
  generateTreeWhitelist,
  getProjectEntities,
  getMilestoneEntities,
  getMetricEntities
};
