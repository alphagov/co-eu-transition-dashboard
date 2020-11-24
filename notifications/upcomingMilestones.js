const config = require('config');
const User = require("models/user");
const Department = require("models/department");
const Role = require("models/role");
const moment = require('moment');
const NotifyClient = require('notifications-node-client').NotifyClient;
const sequelize = require('services/sequelize');
const DAO = require('services/dao');
const logger = require('services/logger');
const locks = require('helpers/locks');

const dao = new DAO({
  sequelize: sequelize
});

const upcomingMilestonesNotifications = {};

upcomingMilestonesNotifications.getProjectsDueInNextTwoDays = async () => {
  const search = {
    date: {
      from: moment().add('2', 'days').format('DD/MM/YYYY'),
      to: moment().add('2', 'days').format('DD/MM/YYYY')
    },
    complete: ['No']
  };

  return await dao.getAllData(null, search);
};

upcomingMilestonesNotifications.groupProjectsByDepartment = projects => {
  return projects.reduce((departments, project) => {
    departments[project.departmentName] = departments[project.departmentName] || [];
    departments[project.departmentName].push(project);
    return departments;
  }, {});
};

upcomingMilestonesNotifications.getUsers = async (departmentName) => {
  return User.findAll({
    include: [{
      model: Department,
      where: {
        name: departmentName
      }
    },{
      model: Role,
      required: true,
      where: {
        name: 'uploader'
      }
    }]
  });
};

upcomingMilestonesNotifications.sendEmails = async (projectsByDepartment) => {
  const notifyClient = new NotifyClient(config.notify.apiKey);
  const summary = { infos: [], errors: [] };

  for(const departmentName in projectsByDepartment) {
    const users = await upcomingMilestonesNotifications.getUsers(departmentName);

    const list = projectsByDepartment[departmentName].reduce((list, project) => {
      project.milestones.forEach(milestone => {
        list.push(`${project.title} - ${milestone.uid}`);
      });
      return list;
    }, []);

    for(const user of users) {
      try {
        await notifyClient.sendEmail(
          config.notify.missedMilestonesKey,
          user.email,
          {
            personalisation: {
              email_address: user.email,
              list: list.join('; '),
              link: config.serviceUrl
            },
            reference: `${user.id}`
          }
        );
        summary.infos.push(`Send upcoming milestone email to ${user.email} for milestones: ${list.join('; ')}`);
        logger.info(`Send upcoming milestone email to ${user.email} for milestones: ${list.join('; ')}`);
      } catch (error) {
        summary.infos.push(`Error sending upcoming milestones email to ${user.email}". ${error}`);
        logger.error(`Error sending upcoming milestones email to ${user.email}". ${error}`);
      }
    }
  }

  return summary;
};

upcomingMilestonesNotifications.sendSummaryNotification = async (summary = { infos: [], errors: [] }) => {
  const notifyClient = new NotifyClient(config.notify.apiKey);

  try {
    await notifyClient.sendEmail(
      config.notify.summaryNotificationKey,
      config.notify.summaryNotificationEmail,
      {
        personalisation: {
          email_address: config.notify.summaryNotificationEmail,
          infos: summary.infos.join(', '),
          errors: summary.errors.join(', ')
        }
      }
    );
  } catch (error) {
    logger.error(`Error sending summary notification email. ${error}`);
  }
};

const notifyUpcomingMilestones = async () => {
  logger.info('Selecting node to send milestone notifications');
  try {
    const guid = await locks.setLock(config.locks.upcomingMilestonesNotifications);

    if(await locks.getLock(guid, config.locks.upcomingMilestonesNotifications)) {

      logger.info('node selected, Send upcoming milstones notifications');
      const projects = await upcomingMilestonesNotifications.getProjectsDueInNextTwoDays();
      const projectsByDepartment = upcomingMilestonesNotifications.groupProjectsByDepartment(projects);
      const summary = await upcomingMilestonesNotifications.sendEmails(projectsByDepartment);
      await upcomingMilestonesNotifications.sendSummaryNotification(summary);
    }
  }
  catch(error) {
    logger.error(`Error notify Upcoming Milestones: ${error}`);
    await upcomingMilestonesNotifications.sendSummaryNotification({ infos: [], errors: [error] });
  }
  finally {
    logger.info('finished Send upcoming milstones notifications');
    await locks.clearLock(config.locks.upcomingMilestonesNotifications);
  }
};

module.exports = {
  notifyUpcomingMilestones,
  upcomingMilestonesNotifications
};
