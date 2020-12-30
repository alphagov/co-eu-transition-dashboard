const EntityFieldEntry = require('models/entityFieldEntry');
const CategoryField = require('models/categoryField');

const getEntitesForCategory = async(categoryId) => {
  const entities = await EntityFieldEntry.findAll({
    attributes:['value', 'entityId'],
    include: {
      model: CategoryField,
      where: {
        name: 'name',
        categoryId
      }
    }
  });
  // let entitiesDetails=[];
  // entities.forEach(entity=>{
  //   const entityToUpdate = entitiesDetails.find(ed => ed.name === entity.value);
  //   if(!entityToUpdate) {
  //     entitiesDetails.push({
  //       name: entity.value,
  //       ids: [entity.entityId]
  //     })
  //   } else {
  //     entityToUpdate.ids.push(entity.entityId)
  //   }
  // })
  const entitiesDetails = entities.map(e => ({
    name: e.value,
    id: e.entityId
  }));
  return entitiesDetails;
}

module.exports = {
  getEntitesForCategory
}