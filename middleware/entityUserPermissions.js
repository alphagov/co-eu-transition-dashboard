const Entity = require('models/entity');
const UserRole = require('models/userRole');
const Role = require('models/role');
const RoleEntity = require('models/roleEntity');
const RoleEntityBlacklist = require('models/roleEntityBlacklist');
const transitionReadinessData = require('helpers/transitionReadinessData');

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
      whitelist = whitelist.concat(role.roleEntities);
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
