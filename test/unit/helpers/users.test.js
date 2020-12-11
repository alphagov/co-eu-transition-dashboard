const { expect, sinon } = require('test/unit/util/chai');
const User = require("models/user");
const users = require('helpers/users');

describe('helpers/users', () => {
  describe('#errorValidations',  () => {
    it('throws validation errors', async()=>{
      try{
        await users.errorValidations({ email:null, roles:null, departments:null })
      } catch (err) {
        const usernameEmptyError = { text:'Email cannot be empty', href: '#username' }
        const rolesEmptyError = { text:'Roles cannot be empty', href: '#roles' }
        const departmentsError = { text:'Departments cannot be empty', href: '#departments' }
        expect(err.message).to.be.equal('VALIDATION_ERROR')
        expect(err.messages).to.deep.include.members([usernameEmptyError, rolesEmptyError, departmentsError])
      }
    })
    it('throws email exists', async()=>{
      try{
        User.findOne = sinon.stub().returns({ id:1 })
        await users.errorValidations({ email:'some@email', roles:'1', departments:'BIS' })
      } catch (err) {
        const userExistsError = { text:'Email exists', href: '#username' }
        expect(err.message).to.be.equal('VALIDATION_ERROR')
        expect(err.messages).to.deep.include.members([userExistsError])
      }
    })
  })
});