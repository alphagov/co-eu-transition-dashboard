const Page = require('core/pages/page');
const { paths } = require('config');
const authentication = require('services/authentication');
const flash = require('middleware/flash');
const User = require('models/user');

class ResetUser2FA extends Page {
  get url() {
    return paths.admin.resetUser2Fa;
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
    return await User.findOne({
      where: {
        id: this.req.params.userId
      }
    });
  }

  async resetUser2FA(user) {
    user.loginAttempts = 0;
    user.twofaSecret = null;
    await user.save();
  }

  async postRequest(req, res) {

    try {
      const user = await this.getUser();
      await this.resetUser2FA(user);

    } catch (error) {
      req.flash(error.message);
      return res.redirect(this.req.originalUrl);
    }

    return res.redirect(`${this.req.originalUrl}/success`);
  }
}

module.exports = ResetUser2FA;