const { expect } = require('test/unit/util/chai');
const EntityHelper = require('helpers/entity');
const Entity = require('models/entity');

const entityMap = {
  1: {
    id: 1,
    publicId: 'bottom entity',
    children: [],
    parents:  [{ id: 2, publicId: 'middle entity' }],
    roles: {
      1: { roleId: 1 }
    }
  },
  2: {
    id: 2,
    publicId: 'middle entity',
    children: [{ id: 1, publicId: 'bottom entity' }],
    parents:  [{ id: 3, publicId: 'top entity' }],
    roles: {
      2: { roleId: 2 }
    }
  },
  3: {
    id: 3,
    publicId: 'top entity',
    children: [{ id: 2, publicId: 'middle entity' }],
    parents:  [],
    roles: {
      2: { roleId: 2 }
    }
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
      roleEntities: [{ roleId: 1 }]
    },{
      id: 2,
      publicId: 'middle entity',
      children: [{ id: 1, publicId: 'bottom entity' }],
      parents:  [{ id: 3, publicId: 'top entity' }],
      roleEntities: [{ roleId: 2 }]
    },{
      id: 3,
      publicId: 'top entity',
      children: [{ id: 2, publicId: 'middle entity' }],
      parents:  [],
      roleEntities: [{ roleId: 2 }]
    }];
    Entity.findAll.resolves(entities);
    entityHelper = new EntityHelper();
  });

  describe('#allEntities', () => {
    it('returns all entities', async () => {
      expect(await entityHelper.getAllEntities()).to.eql(Object.values(entityMap));
    });
  });

  describe('#entitiesWithRoles', () => {
    it('returns all entities which have role', async () => {
      const entitiesWithRole = await entityHelper.entitiesWithRoles([{ id: 2 }]);
      expect(entitiesWithRole).to.eql([entityMap[2], entityMap[3]]);
    });
  });
});
