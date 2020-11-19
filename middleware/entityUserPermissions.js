const Entity = require('models/entity');
const UserRole = require('models/userRole');
const Role = require('models/role');
const RoleEntity = require('models/roleEntity');
const transitionReadinessData = require('helpers/transitionReadinessData');

async function entitiesRoleCanAccess(role) {
  // Returns a promise, no need to await
  return Entity.findAll({
    attributes: ['publicId', 'id'],
    include: {
      model: RoleEntity,
      where: {
        roleId: role.id
      }
    }
  });
}

async function entitiesUserCanAccess(user) {
  let whitelist = [];
  if (user.canViewAllData) {
    //console.log("Allowing user to view all data");
    whitelist = await Entity.findAll({
      attributes: ['publicId', 'id']
    });
  } else {
    let roles = await Role.findAll({
      include: {
        model: UserRole,
        where: { userId: user.id }
      }
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

module.exports = { assignEntityIdsUserCanAccessToLocals, entitiesRoleCanAccess };
