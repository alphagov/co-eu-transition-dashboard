const Page = require('core/pages/page');
const { paths } = require('config');
const authentication = require('services/authentication');
const flash = require('middleware/flash');
const User = require('models/user');
const logger = require('services/logger');

class DeactivateUser extends Page {
  get url() {
    return paths.admin.deactivateUser;
  }

  get pathToBind() {
    return `${this.url}/:userId/:success(success)?`;
  }

  get successMode() {
    return this.req.params && this.req.params.success;
  }

  get middleware() {
    return [
      ...authentication.protect(['admin']),
      flash
    ];
  }

  async getUser() {
    return User.findOne({
      where: {
        id: this.req.params.userId
      }
    });
  }

  async postRequest(req, res) {
    try {
      const user = await this.getUser();
      user.isActive = false;
      await user.save();
    } catch (error) {
      req.flash("Unable to deactivate user.");
      logger.error(error);
      return res.redirect(this.req.originalUrl);
    }

    return res.redirect(`${this.req.originalUrl}/success`);
  }
}

module.exports = DeactivateUser;
