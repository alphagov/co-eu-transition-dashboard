const { expect, sinon } = require("test/unit/util/chai");
const config = require("config");
const EntityRemap = require("pages/admin/entities/entity-remap/EntityRemap");
const authentication = require("services/authentication");
const Category = require('models/category');
const CategoryField = require('models/categoryField');
const CategoryParent = require('models/categoryParent');
const Entity = require('models/entity');
const EntityFieldEntry = require('models/entityFieldEntry');
const EntityParent = require('models/entityParent');
const flash = require('middleware/flash');
const sequelize = require('services/sequelize');

let page = {};
let res = {};
let req = {};
let entityMap = {
  123: {
    id: 123,
    publicId: 'bottom entity',
    parents:  [{ id: 234, publicId: 'middle entity' }],
    category: { id: 2 }
  },
  234: {
    id: 234,
    publicId: 'middle entity',
    parents:  [{ id: 345, publicId: 'top entity' }],
    category: { id: 2 }
  },
  345: {
    id: 345,
    publicId: 'top entity',
    children: [{ id: 234, publicId: 'middle entity' }],
    parents:  [],
    category: { id: 1 }
  }
};

describe("pages/admin/entities/entity-remap/EntityRemap", () => {
  beforeEach(() => {
    res = { cookies: sinon.stub(), redirect: sinon.stub() };
    req = { cookies: [] };

    page = new EntityRemap("some path", req, res);

    sinon.stub(authentication, "protect").returns([]);
  });

  afterEach(() => {
    authentication.protect.restore();
  });

  describe("#url", () => {
    it("returns correct url", () => {
      expect(page.url).to.eql(config.paths.admin.entityRemap);
    });
  });

  describe('#pathToBind', () => {
    it('returns correct url with params', () => {
      expect(page.pathToBind).to.eql(`${config.paths.admin.entityRemap}/:publicId/:success(success)?`);
    });
  });

  describe("#middleware", () => {
    it("only uploaders are allowed to access this page", () => {
      expect(page.middleware).to.eql([
        ...authentication.protect(["admin"]),
        flash
      ]);
    });
  });

  describe('#getCategories', () => {
    const categories =  [ { id: 1, name: 'Theme' }, { id: 2, name: 'Statement' } ]; 

    beforeEach(() => {
      Category.findAll.returns(categories);
    })

    it('returns keyed object of categories', async ()=> {
      const response = await page.getCategories();
      sinon.assert.called(Category.findAll)
      expect(response).to.deep.equal({ 1: 'Theme', 2: 'Statement' })
    });
  });

  describe('#getCategoryParents', () => {
    const categories =  [ { category_id: 2, parent_category_id: 1 }, { category_id: 2, parent_category_id: 2 } ]; 

    beforeEach(() => {
      CategoryParent.findAll.returns(categories);
    })

    it('returns category Parents', async ()=> {
      const response = await page.getCategoryParents();
      sinon.assert.called(CategoryParent.findAll)
      expect(response).to.deep.equal(categories)
    });
  });

  describe('#getEntity', () => {
    const entity =  {
      entityFieldEntries: [{
        categoryField: {
          name: 'name',
        },
        value: 'Some name'
      }],
      id: 2,
      public_id: 'measure-1',
      entityParents: [{ parentEntityId: 123 }]
    }

    beforeEach(() => {
      Entity.findOne.returns(entity);
    })

    it('returns formated entity data', async ()=> {
      const publicId = 2;
      page.req.params = { publicId };

      const response = await page.getEntity();

      sinon.assert.calledWith(Entity.findOne, {
        where: { publicId },
        include: [{
          model: EntityFieldEntry,
          include: {
            model: CategoryField,
          }
        }, 
        {
          model: EntityParent,
          as: 'entityParents',
        }]
      });

      expect(response).to.deep.equal({ 
        ...entity,
        name: 'Some name',
        parents: [123]
      })
    });
  });

  describe("#getParentEntities", async () => {
    const categories =  [ { parentCategoryId: 1 }, { parentCategoryId: 2 } ]; 

    beforeEach(async () => {
      CategoryParent.findAll.returns(categories);
      Entity.findAll.resolves([entityMap[123], entityMap[234], entityMap[345]])
    });

    it("returns an objected key with category ID of entities within that category", async () => {
      const response = await page.getParentEntities({ categoryId:2 });
      expect(response).to.deep.eql({ 1: [ { ...entityMap[345] } ], 2: [ { ...entityMap[123] }, { ...entityMap[234] } ] })
      expect(response).to.have.all.keys(1, 2);
    });
  });

  describe('#validatePostData', () => {
    const categories =  [ { categoryId: 2, parentCategoryId: 1, isRequired: true }, { categoryId: 2, parentCategoryId: 2, isRequired: false } ]; 
    const selectedEntity = { id: 123, categoryId: 2 };

    beforeEach(() => {
      CategoryParent.findAll.returns(categories);
    })

    it('returns an empty array contain when all required category are present in entity post data', async ()=> {
      const postDate = { remapEntities: ["234", "345"] }
      const response = await page.validatePostData(postDate, selectedEntity);
      expect(response).to.eql([]);
    });

    it('returns an array contain an error message when remapEntities is missing from post data', async ()=> {
      const postDate = { }
      const response = await page.validatePostData(postDate, selectedEntity);
      expect(response[0]).to.eql("Must selected at least on parent entity");
    });

    it('returns an array contain an error message when a required category is not in entity post data', async ()=> {
      const postDate = { remapEntities: ["234"] }
      const response = await page.validatePostData(postDate, selectedEntity);
      expect(response[0]).to.eql("Required category missing");
    });
  });

  describe('#formatPostData', () => {
    const selectedEntity = { id: 123, categoryId: 2 };

    it('should return correctly formatted post data', async ()=> {
      const postDate = { remapEntities: ["234", "345"] }
      const response = await page.formatPostData(postDate, selectedEntity);
      expect(response).to.eql([{ entityId: 123, parentEntityId: "234" }, { entityId: 123, parentEntityId: "345" }]);
    });
  });

  describe('#saveData', () => {
    const selectedEntity = { id: 123, categoryId: 2 };
    const formatedPostData = { entityId: 123, parentEntityId: "234" }

    const transaction = sequelize.transaction();

    beforeEach(() => {
      transaction.commit.reset();
      transaction.rollback.reset();

    });

    afterEach(() => {
      EntityParent.destroy.resolves();
    });

    it('saveData should call transaction rollback on error', async () => {
      try{
        EntityParent.destroy.throws(new Error('error'));
        await page.saveData(formatedPostData, selectedEntity);
      } catch(error){
        expect(error.message).to.equal('error');
      }
      sinon.assert.called(transaction.rollback);
    });

    it('saveData should call destroy and bulkCreate and then commmit transaction when successful', async ()=> {
      await page.saveData(formatedPostData, selectedEntity);

      sinon.assert.calledWith(EntityParent.destroy, {
        where: { entityId: selectedEntity.id },
        transaction
      });
      sinon.assert.calledWith(EntityParent.bulkCreate, formatedPostData, { transaction });
      sinon.assert.called(transaction.commit);
    });
  });

  describe('#postRequest', () => {
    const publicId = 2;
    const originalUrl = 'some-url';
    

    const entity =  {
      entityFieldEntries: [{
        categoryField: {
          name: 'name',
        },
        value: 'Some name'
      }],
      id: 2,
      publicId: 'measure-1',
      entityParents:[]
    }

    beforeEach(() => {
      page.req.params = { publicId };
      Entity.findOne.returns(entity);
    })

    it('should call flash and redirect when validation returns an error', async ()=> {
      req = { originalUrl, body: {}, flash: sinon.stub() };
      await page.postRequest(req, res);

      sinon.assert.calledOnce(req.flash);
      sinon.assert.calledWith(page.res.redirect, originalUrl);
    });

    it('should call saveData and redirect when save is successful', async ()=> {
      sinon.stub(page, "saveData");
      req = { originalUrl, body: { remapEntities: ["345"] }, flash: sinon.stub() };
      await page.postRequest(req, res);

      sinon.assert.calledOnce(page.saveData);
      sinon.assert.calledWith(page.res.redirect, `${originalUrl}/success`);
    });

    it('should call flash and redirect when an error occurs during saveData', async ()=> {
      sinon.stub(page, "saveData").throws(new Error('some error'));
      req = { originalUrl, body: { remapEntities: ["345"] }, flash: sinon.stub() };
      await page.postRequest(req, res);

      sinon.assert.calledOnce(req.flash);
      sinon.assert.calledWith(page.res.redirect, originalUrl);
    });
  });



  
});
