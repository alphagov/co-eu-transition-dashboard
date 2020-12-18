const Page = require('core/pages/page');
const { paths } = require('config');
const flash = require('middleware/flash');
const authentication = require('services/authentication');
const Role = require('models/role');


class Permissions extends Page {
  get url() {
    return paths.admin.permissions;
  }

  get middleware() {
    return [
      ...authentication.protect(['admin']),
      flash
    ];
  }

  get pathToBind() {
    return `${this.url}/:roleId?`;
  }

  
  async getRoles() {
    return Role.findAll();
  }

//   getRequest(req, res) {
//     console.log('****req', req);
//   }
}

module.exports = Permissions;