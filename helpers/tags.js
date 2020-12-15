const TagEntity = require('models/tagEntity');
const Tag = require('models/tag');
const sequelize = require("sequelize");
const Op = sequelize.Op;


const createEntityTags = async (entityId, tags, transaction) => {
  let tagsToInsert = [];
  // Tags can be a string or array based on selection
  if (Array.isArray(tags)) {
    tags.forEach(tag => tagsToInsert.push( { entityId, tagId: tag }));
  } else {
    tagsToInsert.push({ entityId, tagId: tags });
  }

  return TagEntity.bulkCreate(tagsToInsert, { transaction });
}

const removeEntitiesTags = async (entityId, transaction) => {
  return TagEntity.destroy({
    where: {
      entityId
    }
  }, { transaction });
}

const createTag = async (name) => {
  const tagExists = await Tag.findOne({
    where:{
      name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), 'LIKE', name.toLowerCase())
    }
  });
  if (tagExists) {
    throw new Error('DUPLICATE_TAG');
  }
  return Tag.create({name});
}

module.exports = {
  createTag,
  createEntityTags,
  removeEntitiesTags
};
