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
  let i;
  for(i in entities) {
    let j;
    const entity = entities[i];
    for(j in entity.parents) {
      const parentEntityId = entity.parents[j].id;
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