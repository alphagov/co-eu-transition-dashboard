const RoleEntity = require('models/roleEntity');

const getEntitiesForRoleId = async(roleId) => {
  return RoleEntity.findAll({
    where: {
      roleId
    }
  });
}

module.exports = {
  getEntitiesForRoleId
}