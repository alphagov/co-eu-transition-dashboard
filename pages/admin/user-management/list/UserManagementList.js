const Page = require('core/pages/page');
const { paths } = require('config');
const authentication = require('services/authentication');
const flash = require('middleware/flash');
const User = require('models/user');
const Role = require('models/role');

class UserManagementList extends Page {
  get url() {
    return paths.admin.userManagementList;
  }

  get middleware() {
    return [
      ...authentication.protect(['admin']),
      flash
    ];
  }

  async getUsers() {
    const users = await User.findAll({
      include: Role
    });
    return users.sort((a, b) => a.email.split('@').pop().localeCompare(b.email.split('@').pop()));
  }
}

module.exports = UserManagementList;