const TagEntity = require('models/tagEntity');

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

module.exports = {
  createEntityTags,
  removeEntitiesTags
};
