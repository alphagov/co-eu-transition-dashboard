const Entity = require('models/entity');
const UserRole = require('models/userRole');
const Role = require('models/role');
const RoleEntity = require('models/roleEntity');
const RoleEntityBlacklist = require('models/roleEntityBlacklist');
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

async function entitiesRoleCanAccess(role) {
  const entityMap = await getEntityMap();

  let whitelist = [];
  role.roleEntities.forEach( (roleEntity) => {
    whitelist = whitelist.concat(getFlatEntityTree(entityMap[roleEntity.entityId],entityMap));
  });

  let blacklist = [];
  role.roleEntityBlacklists.forEach( (roleEntity) => {
    blacklist = blacklist.concat(getFlatEntityTree(entityMap[roleEntity.entityId],entityMap));
  });

  const blacklistMap = blacklist.reduce( (acc,entry) => {
    acc[entry.id] = entry;
    return acc;
  },{});

  return whitelist.filter( entry => !blacklistMap[entry.id]);
}

async function entitiesUserCanAccess(user) {

  let whitelist = [];
  if (user.canViewAllData) {
    //console.log("Allowing user to view all data");
    whitelist = await Entity.findAll({
      attributes: ['publicId', 'id'],
      include: {
        attributes: ['publicId', 'id'],
        model: Entity,
        as: 'children'
      }
    });
  } else {
    let roles = await Role.findAll({ 
      include:[{
        model: UserRole,
        where: { userId: user.id }
      },{
        separate: true,
        model: RoleEntity
      },{
        separate: true,
        model: RoleEntityBlacklist
      }]
    });

    for (const role of roles) {
      whitelist = whitelist.concat(await entitiesRoleCanAccess(role));
    }
  }

  return whitelist;
}

const assignEntityIdsUserCanAccessToLocals = async (req, res, next) => {
  res.locals.entitiesUserCanAccess = await entitiesUserCanAccess(req.user);
  res.locals.themesUserCanAccess = await transitionReadinessData.getThemeEntities(res.locals.entitiesUserCanAccess);

  next();
};

module.exports = { assignEntityIdsUserCanAccessToLocals };
