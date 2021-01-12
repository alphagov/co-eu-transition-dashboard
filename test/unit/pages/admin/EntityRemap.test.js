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

let page = {};
let res = {};
let req = {};

describe("pages/admin/entities/entity-remap/EntityRemap", () => {
  beforeEach(() => {
    res = { cookies: sinon.stub() };
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
      expect(page.pathToBind).to.eql(`${config.paths.admin.entityRemap}/:publicId`);
    });
  });

  describe("#middleware", () => {
    it("only uploaders are allowed to access this page", () => {
      expect(page.middleware).to.eql([
        ...authentication.protect(["admin"]),
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
    let entityMap;
    const categories =  [ { parentCategoryId: 1 }, { parentCategoryId: 2 } ]; 

    beforeEach(async () => {
      CategoryParent.findAll.returns(categories);
      entityMap = {
        2: {
          id: 2,
          publicId: 'middle entity',
          parents:  [{ id: 3, publicId: 'top entity' }],
          category: { id: 2 }
        },
        3: {
          id: 3,
          publicId: 'top entity',
          children: [{ id: 2, publicId: 'middle entity' }],
          parents:  [],
          category: { id: 1 }
        }
      }
      Entity.findAll.resolves([entityMap[2], entityMap[3]]);
    });

    it("returns an objected key with category ID of entities within that category", async () => {
      const response = await page.getParentEntities({ categoryId:2 });
      expect(response).to.deep.eql({ 1: [ { ...entityMap[3] } ], 2: [ { ...entityMap[2] } ] })
      expect(response).to.have.all.keys(1, 2);
    });
  });
});
