const measures = require('helpers/measures');
const sequelize = require("sequelize");
const { notify } = require('config');
const notifyServices =require('services/notify');
const cache = require('services/cache');
const uniq = require('lodash/uniq');
const Op = sequelize.Op;


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
    `${curVal.theme} ${curVal.metricID} ${curVal.name}`));
  
  return uniq(formattedMeasures);
}

const getEmails = () => {
  const mailingList = notify.updatedMeasures.mailingList;
  const emails = mailingList.split(';').map(email => (email.trim()));
  return emails;
}


const notifyUpdatedMeasures = async() => {
  cache.clear();
  const measureEntities = await getMeasuresUpdatedToday();
  const emails = getEmails();
  await notifyServices.sendMeasuresUpdatedTodayEmail({ emails, measures: measureEntities });
}

module.exports = {
  notifyUpdatedMeasures
}