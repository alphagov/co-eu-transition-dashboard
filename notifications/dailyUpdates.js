const measures = require('helpers/measures');
const sequelize = require("sequelize");
const { notify } = require('config');
const notifyServices = require('services/notify');
const Project = require('models/project');
const Milestone = require('models/milestone');
const cache = require('services/cache');
const uniq = require('lodash/uniq');
const Op = sequelize.Op;
const config = require('config');
const locks = require('helpers/locks');

const getMeasuresUpdatedToday = async() => {
  const measureCategory = await measures.getCategory('Measure');
  const themeCategory = await measures.getCategory('Theme');
  const measureEntities = await measures.getMeasureEntities({
    measureCategory,
    themeCategory,
    where: { updated_at: {
      [Op.gte]: sequelize.fn('CURDATE')
    } }
  });
  const formattedMeasures = measureEntities.map((curVal)=>(
    `${curVal.theme} - ${curVal.metricID} - ${curVal.name}`));
  return uniq(formattedMeasures);
}

const getEmails = () => {
  const mailingList = notify.dailyUpdates.mailingList;
  const emails = mailingList.split(';').map(email => (email.trim()));
  return emails;
}

const getProjectesUpdatedToday = async() => {
  const projects =await  Project.findAll({
    attributes: ['uid', 'title'],
    where: { updated_at: {
      [Op.gte]: sequelize.fn('CURDATE')
    } },
  })
  const formattedProjects = projects.map(project => (`${project.uid} - ${project.title}`));
  return formattedProjects;
}

const getMileStonesUpdatedToday = async() => {
  const milestones = await Milestone.findAll({
    attributes: ['uid','description'],
    where: { updated_at: {
      [Op.gte]: sequelize.fn('CURDATE')
    } },
    include: [{
      model: Project,
      attributes: ['uid', 'title']
    }]
  });
  const formattedMilestones = milestones.map(milestone => (
    `${milestone.project.uid} - ${milestone.uid} - ${milestone.description}`
  ));

  return formattedMilestones;
}

const notifyDailyUpdates = async() => {
  const guid = await locks.setLock(config.locks.dailyUpdatesNotifications);

  if(await locks.getLock(guid, config.locks.dailyUpdatesNotifications)) {
    cache.clear();
    const measureEntities = await getMeasuresUpdatedToday();
    const projects = await getProjectesUpdatedToday();
    const milestones = await getMileStonesUpdatedToday();
    const emails = getEmails();
    await notifyServices.sendDailyUpdatesEmail({
      emails, measures: measureEntities, projects, milestones
    });
  }

  await locks.clearLock(config.locks.dailyUpdatesNotifications);
}

module.exports = {
  notifyDailyUpdates
}
