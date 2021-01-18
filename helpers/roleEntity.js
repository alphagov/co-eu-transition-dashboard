const RoleEntity = require('models/roleEntity');
const logger = require('services/logger');
const sequelize = require('services/sequelize');

const getEntitiesForRoleId = async(roleId) => {
  const roleEntities = await RoleEntity.findAll({
    where: {
      roleId
    }
  });
  return roleEntities.reduce((ac, re) => {     
    ac[re.entityId] = {
      canEdit: re.canEdit,
      shouldCascade: re.shouldCascade
    };
    return ac;
  },{})
}

const doesEntityHasParentsPermission = async (roleEntities, entityParents, entityHelpers) => {
  for(const entity of entityParents) {
    if (entity.id in roleEntities && roleEntities[entity.id].shouldCascade) {
      return true;
    }
    entity.parents = await entityHelpers.getParents(entity);
    if (entity.parents && entity.parents.length > 0) {
      return doesEntityHasParentsPermission(roleEntities, entity.parents, entityHelpers)
    }
  }
  
  return false;
}

const deleteRoleEntities = async (roleId, entityIds, transaction ) => {
  return RoleEntity.destroy({ 
    where: {
      roleId,
      entityId: entityIds 
    }, transaction });
}

const bulkUpdateRoleEntities = async (entitiesToUpdate, transaction) => {
  return RoleEntity.bulkCreate(entitiesToUpdate, { 
    transaction, 
    updateOnDuplicate: ["canEdit", "shouldCascade"]
  });
}

const updateRoleEntityTableForRole = async (roleId, { entitiesToUpdate, entitiesToDelete }) => {
  const t = await sequelize.transaction();
  try{
    if (entitiesToDelete && entitiesToDelete.length > 0) {
      await deleteRoleEntities(roleId, entitiesToDelete, t);
    }
    if (entitiesToUpdate && entitiesToUpdate.length > 0) {
      await bulkUpdateRoleEntities(entitiesToUpdate, t);
    }
    await t.commit();
  } catch (err) {
    logger.error(err);
    if (t) {
      await t.rollback();
    }
    throw err;
  }
}


module.exports = {
  getEntitiesForRoleId,
  doesEntityHasParentsPermission,
  updateRoleEntityTableForRole
}