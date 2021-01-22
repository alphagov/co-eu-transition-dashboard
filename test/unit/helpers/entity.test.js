const { expect, sinon } = require('test/unit/util/chai');
const EntityHelper = require('helpers/entity');
const Entity = require('models/entity');
const RoleEntity = require('models/roleEntity');
const EntityFieldEntry = require('models/entityFieldEntry');
const Category = require('models/category');
const CategoryField = require('models/categoryField');

const entityMap = {
  1: {
    id: 1,
    publicId: 'bottom entity',
    children: [],
    parents:  [{ id: 2, publicId: 'middle entity' }],
    roles: {
      1: { roleId: 1 }
    },
    category: { id: 3 }
  },
  2: {
    id: 2,
    publicId: 'middle entity',
    children: [{ id: 1, publicId: 'bottom entity' }],
    parents:  [{ id: 3, publicId: 'top entity' }],
    roles: {
      2: { roleId: 2 }
    },
    category: { id: 2 }
  },
  3: {
    id: 3,
    publicId: 'top entity',
    children: [{ id: 2, publicId: 'middle entity' }],
    parents:  [],
    roles: {
      2: { roleId: 2 }
    },
    category: { id: 1 }
  }
};

let entityHelper;
let entities;

describe('helpers/entityHelper', () => {
  beforeEach(async () => {
    entities = [{
      id: 1,
      publicId: 'bottom entity',
      children: [],
      parents:  [{ id: 2, publicId: 'middle entity' }],
      roleEntities: [{ roleId: 1 }],
      category: { id: 3 }
    },{
      id: 2,
      publicId: 'middle entity',
      children: [{ id: 1, publicId: 'bottom entity' }],
      parents:  [{ id: 3, publicId: 'top entity' }],
      roleEntities: [{ roleId: 2 }],
      category: { id: 2 }
    },{
      id: 3,
      publicId: 'top entity',
      children: [{ id: 2, publicId: 'middle entity' }],
      parents:  [],
      roleEntities: [{ roleId: 2 }],
      category: { id: 1 }
    }];
    Entity.findAll.resolves(entities);
    entityHelper = new EntityHelper({ roles: true, category: true });
  });

  afterEach(() => {
    Entity.findAll = sinon.stub();
  });

  describe('#constructEntityMap', () => {
    const defaultIncludes = [
      { 
        attributes: ['id'],
        model: Entity,
        as: 'children'
      }, {
        attributes: ['id'],
        model: Entity,
        as: 'parents'
      }];

    it('findAll should include role in query', async () => {
      new EntityHelper({ roles: true });

      sinon.assert.calledWith(Entity.findAll, {
        attributes: ['publicId', 'id'],
        include: [
          ...defaultIncludes,
          {
            attributes: ['roleId'],
            model: RoleEntity
          }
        ]
      });
    });

    it('findAll should include fields in query', async () => {
      new EntityHelper({ fields: true });

      sinon.assert.calledWith(Entity.findAll, {
        attributes: ['publicId', 'id'],
        include: [
          ...defaultIncludes,
          {
            seperate: true,
            model: EntityFieldEntry,
            include: {
              attributes: ['name'],
              model: CategoryField,
              where: { isActive: true }
            }
          }
        ]
      });
    });

    it('findAll should include category in query', async () => {
      new EntityHelper({ category: true });

      sinon.assert.calledWith(Entity.findAll, {
        attributes: ['publicId', 'id'],
        include: [
          ...defaultIncludes,
          {
            model: Category
          }
        ]
      });
    });
  });

  describe('#allEntities', () => {
    it('returns all entities', async () => {
      expect(await entityHelper.getAllEntities()).to.eql(Object.values(entityMap));
    });
  });

  // describe('#entitiesWithRoles', () => {
  //   it('returns all entities which have role', async () => {
  //     const entitiesWithRole = await entityHelper.entitiesWithRoles([{ id: 2 }]);
  //     expect(entitiesWithRole).to.eql([entityMap[2], entityMap[3]]);
  //   });

  //   it('throws an error when roles is not set to true when the helper object is created', async() => {
  //     try{
  //       const entityHelperCategory = new EntityHelper({ roles: false });
  //       await entityHelperCategory.entitiesInCategories([1]);
  //     } catch(err) {
  //       expect(err.message).to.equal('Must include category in constructor');
  //     }
  //   });
  // });

  describe('#entitiesInCategories', () => {
    it('returns all entities within the selected category', async () => {
      const entitiesInCategories = await entityHelper.entitiesInCategories([1]);
      expect(entitiesInCategories).to.eql([entityMap[3]]);
    });

    it('throws an error when category is not set to true when the helper object is created', async() => {
      try{
        const entityHelperCategory = new EntityHelper({ category: false });
        await entityHelperCategory.entitiesInCategories([1]);
      } catch(err) {
        expect(err.message).to.equal('Must include category in constructor');
      }
    });
  });

  describe('#getEntityData', () => {
    it('returns entity data for the provided ID', async () => {
      const entityData = await entityHelper.getEntityData(2);
      expect(entityData).to.eql(entityMap[2]);
    });
  });

  describe('#getParents', () => {
    it('returns the parents for the selected entity', async () => {
      const parents = await entityHelper.getParents(entityMap[1]);
      expect(parents).to.deep.eql([entityMap[2]]);
    });
  });

  describe('#entitiesWithViewPermission', ()=>{
    it('gets all entities with view permission', async ()=>{
      const viewRoleEntities = [{ entityId:'a1', shouldCascade: false },{ entityId:'a1', shouldCascade: true }]
      entityHelper.entities ={ 'a1':{ children:[{ id:'b1' },{ id:'b2' }] },'a2':{ children:[] } };
      RoleEntity.findAll.resolves(viewRoleEntities);
      const getAllChildrenEntitiesStub = sinon.stub(entityHelper,'getAllChildrenEntities').resolves();
      await entityHelper.entitiesWithViewPermission([{ id:1 },{ id:2 }]);
      expect(getAllChildrenEntitiesStub.callCount).to.eql(2);      
      expect(getAllChildrenEntitiesStub.getCall(0).args).include.members(['b1']);
      expect(getAllChildrenEntitiesStub.getCall(1).args).include.members(['b2']);
    })
  })

  
  describe('#getAllChildrenEntities', ()=>{
    it('returns the all children for an entity', async () => {
      const entitesWithViewRoles = {};
      const allEntities = {
        'a1' :{
        },
        'a2':{
        },
        'b1':{
        },
        'b2':{
        }
      }
      const entityId = 'a1';
      const getEntityDataStub = sinon.stub(entityHelper, 'getEntityData');
      const sp = sinon.spy(entityHelper,'getAllChildrenEntities');
      getEntityDataStub.onCall(0).resolves({ children:[{ id:'b1' }, { id:'b2' },{ id:'a2' }] });
      getEntityDataStub.onCall(1).resolves({ children:[] });
      getEntityDataStub.onCall(2).resolves({ children:[] });

      getEntityDataStub.onCall(3).resolves({ children:[{ id:'b1' }] });
      
      await entityHelper.getAllChildrenEntities(entityId, entitesWithViewRoles, allEntities);
      expect(sp.callCount).to.eql(5);      
      expect(entitesWithViewRoles).to.eql(allEntities);
      sp.restore();
      getEntityDataStub.restore();
    });
  })
});
