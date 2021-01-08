const RoleEntity = require('models/roleEntity');

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


module.exports = {
  getEntitiesForRoleId,
  doesEntityHasParentsPermission
}