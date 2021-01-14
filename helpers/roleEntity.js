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

const doesEntityHasParentsPermission = (roleEntities, entities) => {
  for(const entity of entities) {
    for(const parent of entity.parents) {
      const parentEntityId = parent.id;
      if (parentEntityId in roleEntities && roleEntities[parentEntityId].shouldCascade) {
        return true;
      }
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