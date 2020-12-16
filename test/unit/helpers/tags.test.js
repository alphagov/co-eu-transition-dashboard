const { expect, sinon } = require('test/unit/util/chai');
const tags = require('helpers/tags');
const sequelize = require('services/sequelize');
const TagEntity = require('models/tagEntity');
const Tag = require('models/tag');

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

  describe('#createTag', () => {
    beforeEach(()=>{
      sequelize.col = sinon.stub().returns();
      sequelize.fn = sinon.stub().returns();
      sequelize.where = sinon.stub().returns();
    });

    it('should create a tag', async ()=> {
      const mockTag = 'mocktag';
      Tag.findOne = sinon.stub().returns();
      Tag.create = sinon.stub().returns({ id:1, name: mockTag })

      await tags.createTag(mockTag);

      sinon.assert.calledWith(Tag.create, { name: mockTag });
      sinon.assert.called(Tag.findOne);
    })

    it('should throw an error when tag is already created', async ()=> {
      try {
        Tag.findOne = sinon.stub().returns({ id:1, name: '123' });
        await tags.createTag('test tag');
      } catch (err) {
        expect(err.message).to.be.equal('DUPLICATE_TAG');
      }
    })
  })
});