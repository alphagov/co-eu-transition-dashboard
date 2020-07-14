const Page = require('core/pages/page');
const config = require('config');
const startPage = require('helpers/startPage');

class Start extends Page {
  get url() {
    return startPage();
  }

  async handler(req, res) {
    if(req.user.mustChangePassword) {
      return res.redirect(config.paths.authentication.passwordReset);
    }

    if (config.features.missedMilestones){
      return res.redirect(config.paths.missedMilestones);
    }

    return res.redirect(config.paths.allData);
  }
}

module.exports = Start;