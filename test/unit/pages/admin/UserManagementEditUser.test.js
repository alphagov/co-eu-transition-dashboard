const { expect, sinon } = require('test/unit/util/chai');
const { paths } = require('config');
const authentication = require('services/authentication');
const flash = require('middleware/flash');
const Role = require('models/role');
const User = require("models/user");
const UserRole = require("models/userRole");
const Department = require('models/department');
const DepartmentUser = require("models/departmentUser");
const sequelize = require('services/sequelize');
const EditUser = require('pages/admin/user-management/edit-user/EditUser');
const usersHelper = require('helpers/users');

let page = {};

describe('pages/admin/user-management/edit-user/EditUser', () => {
  beforeEach(()=>{
    const res = { cookies: sinon.stub(), redirect: sinon.stub() };
    const req = { cookies: [], params: { userId: 123 }, flash: sinon.stub(), originalUrl: 'some-url' };
    page = new EditUser('some path', req, res);
    sinon.stub(authentication, 'protect').returns([]);
  });

  afterEach(() => {
    authentication.protect.restore();
  });

  describe('#url', () => {
    it('returns correct url', () => {
      expect(page.url).to.eql(paths.admin.editUser);
    });
  });
    
  describe('#pathToBind', () => {
    it('returns correct url', () => {
      expect(page.pathToBind).to.eql(`${paths.admin.editUser}/:userId/:success(success)?`);
    });
  });

  describe('#editUrl', () => {
    it('returns correct url for edit form', () => {
      expect(page.editUrl).to.eql(`${paths.admin.editUser}/${page.req.params.userId}`);
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

  describe('#successMode', () => {
    it('returns success is undefined when success param not set', () => {
      expect(page.successMode).to.be.undefined;
    });

    it('returns success is true when success param not set', () => {
      page.req.params = { success: true }
      expect(page.successMode).to.be.true;
    });
  });

  describe('#getUser', () => {
    const userData = {
      id:1, 
      email: 'test@email.com',
      departments: [],
      roles:[]
    };

    beforeEach(()=>{
      User.findOne.returns(userData);
    })


    it('should call FindOne with the correct params', async () => {
      const response = await page.getUser();

      expect(response).to.eql(userData);

      sinon.assert.calledWith(User.findOne, {
        where: {
          id: page.req.params.userId
        },
        include: [{
          model: Department
        },{
          model: Role
        }]
      });
    });
  });

  describe('#getRoles', () => {
    const roles =  [ { id: 1, name: 'admin' }, { id: 2, name: 't2' } ]; 

    beforeEach(()=>{
      Role.findAll.returns(roles);
    })

    it('return list of roles and whether they should be checked', async ()=>{
      const response = await page.getRoles([ { id: 1 }]);
      sinon.assert.called(Role.findAll)
      expect(response).to.deep.equal([ { value: 1, text: 'admin', checked: true }, { value: 2, text: 't2', checked: false } ])
    });
  });

  describe('#getDepartments', () => {
    const departments =[ { name: 'depart-1' }, { name: 'depart-2' } ];

    beforeEach(()=>{
      Department.findAll.returns(departments);
    })

    it('return list of departments and whether they should be checked', async () => {
      const response = await page.getDepartments([ { name: 'depart-2' }]);
      sinon.assert.called(Department.findAll)
      expect(response).to.deep.equal([ { value: 'depart-1', text: 'depart-1', checked: false }, { value: 'depart-2', text: 'depart-2', checked: true } ])
    });
  });

  describe('#getData', () => {
    const userData = {
      id:1, 
      email: 'test@email.com',
      departments: [ { name: 'depart-1' } ],
      roles:[ { id: 1, name: 'admin' } ]
    };

    beforeEach(()=>{
      sinon.stub(page, 'getUser').returns(userData);
    })

    afterEach(() => {
      page.getUser.restore();
    });

    it('should check all funcations are called', async () => {
      page.getRoles = sinon.stub();
      page.getDepartments = sinon.stub();

      await page.getData();

      sinon.assert.called(page.getUser)
      sinon.assert.calledWith(page.getRoles, userData.roles)
      sinon.assert.calledWith(page.getDepartments, userData.departments)
    });
  });

  describe('#updateUser', () => {
    it('should call update with correct params', async () => {
      const id = 123
      const email = 'test@email.com'
      const transaction = sequelize.transaction();

      User.update = sinon.stub();
      await page.updateUser(id, email, transaction);

      sinon.assert.calledWith(User.update, {
        email,
      }, { where: { id }, transaction });
    });
  });

  describe('#formatDataToSave', () => {
    it('should return formatted data when input is in array format', () => {
      const userId = 123;
      const formFieldData = ['1', '2'];
      const columnId = 'roleId'

      const response = page.formatDataToSave(userId, formFieldData, columnId);

      expect(response).to.deep.equal([ { userId, roleId: '1' }, { userId, roleId: '2' } ])
    });

    it('should return formatted data when input is in string format', () => {
      const userId = 123;
      const formFieldData = '321';
      const columnId = 'roleId'

      const response = page.formatDataToSave(userId, formFieldData, columnId);

      expect(response).to.deep.equal([ { userId, roleId: '321' }, ])
    });
  });

  describe('#updateUserRoles', () => {
    it('should call functions with the correct params', async () => {
      const userId = 123;
      const roles = ['456', '567']
      const transaction = sequelize.transaction();
      const userRoleData = [{ userId, roleId: '1' }]
      page.formatDataToSave = sinon.stub().returns(userRoleData);

      await page.updateUserRoles(userId, roles, transaction);

      sinon.assert.calledWith(page.formatDataToSave, userId, roles, 'roleId')
      sinon.assert.calledWith(UserRole.destroy, {
        where: { userId },
        transaction
      });
      sinon.assert.calledWith(UserRole.bulkCreate, userRoleData, { transaction } );
    });
  });

  describe('#updateUserDepartments', () => {
    it('should call functions with the correct params', async () => {
      const userId = 123;
      const departments = ['test']
      const transaction = sequelize.transaction();
      const departmentsData = [{ userId, departmentName: 'test' }]
      page.formatDataToSave = sinon.stub().returns(departmentsData);

      await page.updateUserDepartments(userId, departments, transaction);

      sinon.assert.calledWith(page.formatDataToSave, userId, departments, 'departmentName')
      sinon.assert.calledWith(DepartmentUser.destroy, {
        where: { userId },
        transaction
      });
      sinon.assert.calledWith(DepartmentUser.bulkCreate, departmentsData, { transaction } );
    });
  });

  describe('#updateData', () => {
    const email = 'some@email.com'
    const roles = [1,2]
    const departments = ['DIT']

    const transaction = sequelize.transaction()

    beforeEach(() => {
      page.updateUserRoles = sinon.stub().returns();
      page.updateUserDepartments = sinon.stub().returns();
      sequelize.transaction = sinon.stub().returns(transaction);
    });

    it('should call all functions and commit transation', async () => {
      page.updateUser = sinon.stub().returns();

      await page.updateData({ email, roles, departments })

      const { userId } = page.req.params;

      sinon.assert.calledWith(page.updateUser, userId, email, transaction);
      sinon.assert.calledWith(page.updateUserRoles, userId, roles, transaction);
      sinon.assert.calledWith(page.updateUserDepartments, userId,  departments, transaction);
      sinon.assert.called(transaction.commit);
    })

    it('should call transaction rollback on error', async () => {
      try{
        page.updateUser = sinon.stub().throws(new Error('error'));
        await page.updateData({ email, roles, departments });
      } catch(error){
        expect(error.message).to.equal('error');
      }
      sinon.assert.called(transaction.rollback);
      sinon.assert.notCalled(page.updateUserRoles);
      sinon.assert.notCalled(page.updateUserDepartments);
    });
  });

  describe('#postRequest', () => {
    const roles = ['t1', 't2'];
    const departments = ['depart-1'];
    const email = 'some@email.com';
    
    beforeEach(() => {
      page.updateData = sinon.stub()
    });
    
    it('should call validation and updateData ', async () => {
      const errorValidationsStub = sinon.stub(usersHelper, 'errorValidations')
      page.req.body = { email, departments, roles }
      const { userId } = page.req.params;
      await page.postRequest(page.req, page.res);
        
      sinon.assert.calledWith(usersHelper.errorValidations, { email, departments, roles, userId });
      sinon.assert.calledWith(page.updateData, { email, departments, roles });
    
      sinon.assert.calledWith(page.res.redirect, `${page.req.originalUrl}/success`);
      errorValidationsStub.restore()
    });
    
    it('redirects to original url if error and sets error to flash', async () => {
      page.req.body = { departments, roles }
      await page.postRequest(page.req, page.res);
    
      sinon.assert.called(page.req.flash);
      sinon.assert.calledWith(page.res.redirect, page.req.originalUrl);
    });
  });
  
});