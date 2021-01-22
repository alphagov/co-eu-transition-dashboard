/* eslint-disable no-prototype-builtins */
const EntityHelper = require('helpers/entity');
const UserRole = require('models/userRole');
const Role = require('models/role');

const filterMetrics = async (user, entities) => {
  let filteredMetrics;
  const entityHelper = new EntityHelper({ roles: true });

  if (user.canViewAllData) {
    filteredMetrics = entities;
  } else {
    let roles = await Role.findAll({
      include: {
        model: UserRole,
        where: { userId: user.id }
      }
    });
    const entitiesWithEditPermission = await entityHelper.entitiesWithEditPermission(roles);
    filteredMetrics = entities.filter(e => e.id in entitiesWithEditPermission);
  } 
  return filteredMetrics;
};

module.exports = {
  filterMetrics
};
