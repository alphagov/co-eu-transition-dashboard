const { expect, sinon } = require('test/unit/util/chai');
const { paths } = require('config');
const authentication = require('services/authentication');
const flash = require('middleware/flash');
const Role = require('models/role');
const Category = require('models/category');
const Permissions = require('pages/admin/permissions/Permissions');

let page = {};
let req = {};

describe('pages/admin/permissions/Permissions', ()=>{
  beforeEach(()=>{
    const res = { cookies: sinon.stub(), redirect: sinon.stub() };
    req = { cookies: [], params: {}, flash: sinon.stub(), originalUrl: 'some-url' };
    page = new Permissions('some path', req, res);
    sinon.stub(authentication, 'protect').returns([]);
  });

  afterEach(() => {
    authentication.protect.restore();
  });

  describe('#url', () => {
    it('returns correct url', () => {
      expect(page.url).to.eql(paths.admin.permissions);
    });
  });
    
  describe('#pathToBind', () => {
    it('returns correct url', () => {
      expect(page.pathToBind).to.eql(`${paths.admin.permissions}/:roleId?/:categoryId?`);
    });
  });

  describe('#middleware', () => {
    it('only admins are aloud to access this page', () => {
      expect(page.middleware).to.eql([
        ...authentication.protect(['admin']),
        flash
      ]);
    
      sinon.assert.calledWith(authentication.protect, ['admin']);
    });
  });

  describe('#getRoles', ()=>{
    const rolesDB= [{
      id:1,
      name:'t1'
    },{
      id:2,
      name: 't2'
    }];
    const expectedRoles = [{
      id:0,
      name:'Select Role'
    },
    {
      id:1,
      name:'t1'
    },{
      id:2,
      name: 't2'
    }]
    beforeEach(()=>{
      Role.findAll = sinon.stub().returns(rolesDB);
    })
    it('return list of roles', async()=>{
      const roles = await page.getRoles();
      sinon.assert.called(Role.findAll)
      expect(roles).to.deep.equal(expectedRoles)
    })
  })

  describe('#getCategories', ()=>{
    const categoriesDb= [{
      id: 1,
      name: 'Border'
    },{
      id: 2,
      name: 'People'
    }];
    const expectedCategories = [{
      id: 1,
      name: 'Border'
    },{
      id: 2,
      name: 'People'
    }]
    beforeEach(()=>{
      Category.findAll = sinon.stub().returns(categoriesDb);
    })
    it('return list of categories when roleId is in URL', async()=>{
      req.params.roleId = 1;
      const categories = await page.getCategories();
      sinon.assert.called(Category.findAll)
      expect(categories).to.deep.equal(expectedCategories)
    });
    it('return null when roleId is 0', async()=>{
      req.params.roleId = 0;
      const categories = await page.getCategories();
      sinon.assert.notCalled(Category.findAll)
      expect(categories).to.deep.equal([])
    });
    it('return null when roleId is undefined', async()=>{
      req.params.roleId = undefined;
      const categories = await page.getCategories();
      sinon.assert.notCalled(Category.findAll)
      expect(categories).to.deep.equal([])
    });
  });

  describe('#selectedCategoryId', ()=>{
    it('should return categoryId if set', ()=>{
      req.params.categoryId = 1;
      expect(page.selectedCategoryId).to.eql(1);
    });

    it('should return categoryId as 0 if not set', ()=>{
      req.params.categoryId = undefined;
      expect(page.selectedCategoryId).to.eql(0);
    });
  });

  describe('#selectedRoleId', ()=>{
    it('should return roleId if set', ()=>{
      req.params.roleId = 1;
      expect(page.selectedRoleId).to.eql(1);
    });

    it('should return roleId as 0 if not set', ()=>{
      req.params.roleId = undefined;
      expect(page.selectedRoleId).to.eql(0);
    });
  });
});