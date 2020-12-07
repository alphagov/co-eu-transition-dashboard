const { sinon } = require('test/unit/util/chai');
const tags = require('helpers/tags');
const sequelize = require('services/sequelize');
const TagEntity = require('models/tagEntity');

describe('helpers/tags', () => {
  const transaction = sequelize.transaction();
  
  beforeEach(() => {
    TagEntity.bulkCreate.reset();
  });

  describe('#createEntityTags', () => {
    it('should call bulkCreate when tags data is in array format', () => {
      const entityId = 123;
      const tagsData = ['1', '2'];

      tags.createEntityTags(entityId, tagsData, transaction);

      sinon.assert.calledWith(TagEntity.bulkCreate, [{ entityId, tagId: '1' }, { entityId, tagId: '2' } ], { transaction });
    });

    it('should call bulkCreate when tags data is in string format', () => {
      const entityId = 456;
      const tagsData = '1';

      tags.createEntityTags(entityId, tagsData, transaction);

      sinon.assert.calledWith(TagEntity.bulkCreate, [
        { entityId, tagId: '1' } ], { transaction });
    });
  });

  describe('#removeEntitiesTags', () => {
    it('should call destroy with correct entity ID', () => {
      const entityId = 567;

      tags.removeEntitiesTags(entityId, transaction);

      sinon.assert.calledWith(TagEntity.destroy, {
        where: {
          entityId
        }
      }, { transaction });
    });
  });
});