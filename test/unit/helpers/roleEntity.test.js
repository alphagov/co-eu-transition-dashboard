const { expect,sinon } = require('test/unit/util/chai');
const roleEntity = require('helpers/roleEntity');
const RoleEntity = require('models/roleEntity');

describe('helpers/roleEntity', ()=>{
  describe('getEntitiesForRoleId', ()=>{
    const roleId = 1;
    it('should return all entites along their ids', async ()=>{
      RoleEntity.findAll = sinon.stub().resolves([{ 
        entityId:1, canEdit: true, shouldCascade: false 
      }, {
        entityId:2, canEdit: false, shouldCascade: true 
      }]);
      const entities = await roleEntity.getEntitiesForRoleId(roleId);
      expect(entities).to.eql({
        '1': { canEdit: true, shouldCascade: false },
        '2': { canEdit: false, shouldCascade: true }
      })
    })
  });

  describe('doesEntityHasParentsPermission', ()=>{
    it('should return true when parent has shouldCascade true', ()=>{
      const roleEntities = {
        '1':{
          shouldCascade: false
        },
        '2':{
          shouldCascade: true
        }
      };
      const heierarcy = [{
        id: 5,
        parents: [{ id:3 },{ id:2 }]
      }];

      const hasParentsPermission = roleEntity.doesEntityHasParentsPermission(roleEntities,heierarcy);
      expect(hasParentsPermission).to.be.true;
    });

    it('should return false when parent has shouldCascade false', ()=>{
      const roleEntities = {
        '1':{
          shouldCascade: false
        },
        '2':{
          shouldCascade: false
        }
      };
      const entities = [{
        parents: [{ id:3 },{ id:2 }]
      }];

      const hasParentsPermission = roleEntity.doesEntityHasParentsPermission(roleEntities,entities);
      expect(hasParentsPermission).to.be.false;
    });

    it('should return false when parent is not in roleEntities', ()=>{
      const roleEntities = {
        '1':{
          shouldCascade: false
        },
        '2':{
          shouldCascade: true
        }
      };
      const entities = [{
        parents: [{ id:3 },{ id:4 }]
      }];
  
      const hasParentsPermission = roleEntity.doesEntityHasParentsPermission(roleEntities,entities);
      expect(hasParentsPermission).to.be.false;
    });
  });

  describe('updateRoleEntityTableForRole', ()=>{
    const roleId = 1
    const entitiesToUpdate = [{ roleId, entityId: 2, canEdit: true, shouldCascade: false },
      { roleId, entityId: 3, canEdit: false, shouldCascade: false }];
    const entitiesToDelete = [4,5];

    let destroyStub;
    let bulkCreateStub;
    
    beforeEach(()=>{
      destroyStub = sinon.stub().resolves([]);
      bulkCreateStub = sinon.stub().resolves([]);
      RoleEntity.destroy = destroyStub;
      RoleEntity.bulkCreate = bulkCreateStub;
    });

    afterEach(()=>{
      RoleEntity.destroy.reset(); 
      RoleEntity.bulkCreate.reset();
    })

    it('should delete and update role entities', async()=>{
      await roleEntity.updateRoleEntityTableForRole(roleId, { entitiesToUpdate, entitiesToDelete });
      sinon.assert.calledOnce(destroyStub);
      expect(bulkCreateStub).to.be.calledWith(entitiesToUpdate);
    });

    it('should not call delete or update role entities when empty', async()=>{
      await roleEntity.updateRoleEntityTableForRole(roleId, { entitiesToUpdate:[], entitiesToDelete:[] });
      sinon.assert.notCalled(destroyStub);
      sinon.assert.notCalled(bulkCreateStub);
    });
  });
});