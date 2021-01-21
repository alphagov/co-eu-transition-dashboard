const { expect, sinon } = require("test/unit/util/chai");
const config = require("config");

const EntityList = require("pages/admin/entities/entity-list/EntityList");
const authentication = require("services/authentication");
const Entity = require("models/entity");
const Category = require("models/category");

let page = {};
let res = {};
let req = {};

describe("pages/admin/entities/entity-list/EntityList", () => {
  beforeEach(() => {
    res = { cookies: sinon.stub() };
    req = { cookies: [] };

    page = new EntityList("some path", req, res);

    sinon.stub(authentication, "protect").returns([]);
  });

  afterEach(() => {
    authentication.protect.restore();
  });

  describe("#url", () => {
    it("returns correct url", () => {
      expect(page.url).to.eql(config.paths.admin.entityList);
    });
  });

  describe("#middleware", () => {
    it("only uploaders are allowed to access this page", () => {
      expect(page.middleware).to.eql([
        ...authentication.protect(["admin"]),
      ]);
    });
  });

  describe('#categorySelected', ()=>{
    it('should return categoryId if set', ()=>{
      page.req.params = { categoryId: 1 };
      expect(page.categorySelected).to.eql(1);
    });

    it('should return categoryId as 0 if not set', ()=>{
      page.req.params = {};
      expect(page.categorySelected).to.eql(0);
    });
  });
  
  describe('#getCategories', () => {
    const categories =  [ { id: 1, name: 'Thene' }, { id: 2, name: 'Statement' } ]; 

    beforeEach(()=>{
      Category.findAll.returns(categories);
    })

    it('returns list of categories', async ()=>{
      const response = await page.getCategories([ { id: 1 }]);
      sinon.assert.called(Category.findAll)
      expect(response).to.deep.equal(categories)
    });
  });

  describe("#getEntitiesForCategory", async () => {
    let entityMap;
    beforeEach(async () => {
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

    it("returns list of entities within a category along with their hierarchy", async () => {
      const response = await page.getEntitiesForCategory(2);
      expect(response).to.eql([{ ...entityMap[2], parents:[entityMap[3]] }])
    });
  });
});
