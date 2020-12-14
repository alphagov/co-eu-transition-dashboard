const User = require("models/user");
const VALIDATION_ERROR_MESSSAGE = 'VALIDATION_ERROR';

const errorValidations = async ({ email, roles, departments, userId }) => {
  let error = new Error(VALIDATION_ERROR_MESSSAGE);
  error.messages = [];
  let userExists;
  if (!email) {
    error.messages.push({ text:'Email cannot be empty', href: '#username' });
  } else {
    // Check if user exists
    userExists = await User.findOne({ where: { email } });
  }
  if (userExists && userId != userExists.id) {
    error.messages.push({ text:'Email exists', href: '#username' });
  }
  if (!roles) {
    error.messages.push({ text:'Roles cannot be empty', href: '#roles' });
  }
  if(!departments) {
    error.messages.push({ text:'Departments cannot be empty', href: '#departments' });
  }
  if (error.messages.length > 0) {
    throw error;
  } 
}

module.exports = {
  errorValidations
};