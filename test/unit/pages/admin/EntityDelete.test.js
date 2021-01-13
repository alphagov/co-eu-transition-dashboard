const { expect, sinon } = require("test/unit/util/chai");
const config = require("config");
const EntityDelete = require("pages/admin/entities/entity-delete/EntityDelete");
const authentication = require("services/authentication");
const Entity = require("models/entity");
const EntityFieldEntry = require('models/entityFieldEntry');
const CategoryField = require('models/categoryField');
const flash = require('middleware/flash');

let page = {};
let res = {};
let req = {};

describe("pages/admin/entities/entity-delete/EntityDelete", () => {
  beforeEach(() => {
    res = { cookies: sinon.stub(), redirect: sinon.stub() };
    req = { cookies: [], params: { publicId: 1 }, flash: sinon.stub() };

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
    it("only admins are allowed to access this page", () => {
      expect(page.middleware).to.eql([
        ...authentication.protect(["admin"]),
        flash
      ]);
    });
  });

  describe('#pathToBind', () => {
    it('returns correct url with param', () => {
      expect(page.pathToBind).to.eql(`${config.paths.admin.entityDelete}/:publicId/:successful(successful)?`);
    });
  });

  describe('#successfulMode', () => {
    it('returns true when in successful mode', () => {
      page.req.params = { publicId: '1', successful: 'successful' };
      expect(page.successfulMode).to.be.ok;
    });

    it('returns false when not in successful mode', () => {
      expect(page.successfulMode).to.be.not.ok;
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

  describe('#postRequest', () => {
    beforeEach(() => {
      sinon.stub(page, 'deleteEntity')
    });

    afterEach(() => {
      page.deleteEntity.restore();
    });

    it('should call entityDelete and redirect to sucessful url', async () => {
      req.originalUrl = 'someurl';
      await page.postRequest(req, res);

      sinon.assert.calledOnce(page.deleteEntity);
      sinon.assert.calledWith(res.redirect, `${req.originalUrl}/successful`);
    });

    it('should call entityDelete and redirect back to delete page when an error occurs', async () => {
      req.originalUrl = 'someurl';

      page.deleteEntity.throws('error')

      await page.postRequest(req, res);

      sinon.assert.calledOnce(page.deleteEntity);
      sinon.assert.calledWith(req.flash, 'An error has occurred when deleting this entity');
      sinon.assert.calledWith(res.redirect, req.originalUrl);
    });
  });

  describe('#deleteEntity', () => {
    it('deletes entity and parents', async () => {
      await page.deleteEntity();

      sinon.assert.calledWith(Entity.destroy, {
        where: {
          public_id: page.req.params.publicId
        }
      });
    });
  });
});
