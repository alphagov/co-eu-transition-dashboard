const Project = require('models/project');
const Milestone = require('models/milestone');
const User = require('models/user');
// const sequelize = require('sequelize');
const Department = require('models/department');
const sequelize = require('services/sequelize');
const { Op } = require('sequelize');

const getFiltersWithCounts = async (attribute, search, user) => {
  const searchIgnoreCurrentAttribute = Object.assign({}, search.projects);
  delete searchIgnoreCurrentAttribute[attribute.fieldName];

  const attributes = [];
  let group;

  // if(attribute.showCount) {
    attributes.push([sequelize.literal(`project.${attribute.fieldName}`), 'value']);
    attributes.push([sequelize.literal(`COUNT(DISTINCT project.uid)`), 'count']);

    group = [];
    group.push(`project.${attribute.fieldName}`);
  // } else {
  //   attributes.push([sequelize.literal(`DISTINCT project.${attribute.fieldName}`), 'value']);
  // }

  return await Project.findAll({
    attributes: attributes,
    where: {
      [attribute.fieldName]: { [Op.ne]: null }
    },
    // where: searchIgnoreCurrentAttribute,
    include: [
      {
        model: Milestone,
        attributes: [],
        required: true
      },
      {
        model: Department,
        required: true,
        attributes: [],
        include: [{
          attributes: [],
          model: User,
          required: true,
          where: {
            id: user.id
          }
        }]
      }
    ],
    group,
    raw: true,
    nest: true,
    includeIgnoreAttributes: false
  });
};

const applyDefaultOptions = (attribute, options) => {
  if (attribute.values) {
    return attribute.values.map(value => {
      const found = options.find(r => r.value === value);
      return {
        value,
        count: found ? found.count : 0
      }
    });
  }

  return options;
};

const getFilters = async (search = {}, user) => {
  const filters = [];

  for(const attributeName of Object.keys(Project.rawAttributes)) {
    const attribute = Project.rawAttributes[attributeName];
    if (!attribute.searchable) continue;

    let options = await getFiltersWithCounts(attribute, search, user);

    filters.push({
      id: attribute.fieldName,
      name: attribute.displayName,
      options
    });
  }

  const fields = await sequelize.models.projectField.findAll({
    include: [{
      model: sequelize.models.projectFieldEntry,
      include: [{
        model: sequelize.models.projectField,
        required: true
      },
      {
        model: Project,
        attributes: [],
        required: true,
        include: [{
          model: Department,
          required: true,
          attributes: [],
          include: [{
            attributes: [],
            model: User,
            required: true,
            where: {
              id: user.id
            }
          }]
        }]
      }]
    }]
  });

  fields.forEach(field => {
    const defaultOptions = [];

    const options = field.projectFieldEntries.reduce((options, projectFieldEntry) => {
      const option = options.find(option => option.value === projectFieldEntry.value);
      if(option) {
        option.count ++;
      } else {
        options.push({ count: 1, value: projectFieldEntry.value })
      }
      return options;
    }, defaultOptions);


    filters.push({
      id: JSON.stringify({
        path: 'projects->ProjectFieldEntryFilter',
        id: field.id
      }),
      name: field.name,
      options
    });
  });

  filters.forEach(filter => {
    filter.options = filter.options.sort((a,b) => {
      return a.value > b.value;
    });
  });

  return filters;
};

module.exports = {
  getFiltersWithCounts,
  applyDefaultOptions,
  getFilters
};