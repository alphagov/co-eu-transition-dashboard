const { expect, sinon } = require("test/unit/util/chai");
const config = require("config");
const EntityDelete = require("pages/admin/entity-delete/EntityDelete");
const authentication = require("services/authentication");
const Entity = require("models/entity");
const EntityFieldEntry = require('models/entityFieldEntry');
const CategoryField = require('models/categoryField');

let page = {};
let res = {};
let req = {};

describe("pages/admin/entity-delete/EntityDelete", () => {
  beforeEach(() => {
    res = { cookies: sinon.stub() };
    req = { cookies: [] };

    page = new EntityDelete("some path", req, res);

    page.req.params = { publicId: 1 };

    sinon.stub(authentication, "protect").returns([]);
  });

  afterEach(() => {
    authentication.protect.restore();
  });

  describe("#url", () => {
    it("returns correct url", () => {
      expect(page.url).to.eql(config.paths.admin.entityDelete);
    });
  });

  describe("#middleware", () => {
    it("only uploaders are allowed to access this page", () => {
      expect(page.middleware).to.eql([
        ...authentication.protect(["admin"]),
      ]);
    });
  });

  describe('#pathToBind', () => {
    it('returns correct url with param', () => {
      expect(page.pathToBind).to.eql(`${config.paths.admin.entityDelete}/:publicId`);
    });
  });
  
  describe('#getEntity', () => {
    const entity =  { 
      public_id: 1, 
      entityFieldEntries: [{
        categoryField: {
          name: 'name',
        },
        value: 'name one'
      }], children: [{ 
        public_id: 2, 
        entityFieldEntries: [{
          categoryField: {
            name: 'name',
          },
          value: 'name two' 
        }] 
      }] 
    }; 

    beforeEach(()=>{
      Entity.findOne.returns(entity);
    });

    it('returns entity and its children based on publicId', async ()=>{
      const response = await page.getEntity();

      sinon.assert.calledWith(Entity.findOne, {
        where: {
          public_id: page.req.params.publicId
        },      
        include: [{
          model: Entity,
          as: 'children',
          include: {
            model: EntityFieldEntry,
            include: {
              model: CategoryField
            }
          }
        }, {
          model: EntityFieldEntry,
          include: {
            model: CategoryField
          }
        }]
      });

      expect(response).to.deep.equal({ 
        children: [{
          entityFieldEntries: [{
            categoryField: {
              name: 'name'
            },
            value: 'name two'
          }],
          name: 'name two',
          public_id: 2
        }],
        entityFieldEntries: [{
          categoryField: {
            name: 'name'
          },
          value: 'name one'
        }
        ],
        name: 'name one',
        public_id: 1
      })
    })
  })
});
