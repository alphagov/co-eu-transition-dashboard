const dev = require('../../../config/development.json')

//Login Control
const BTN_Submit = 'button.govuk-button';
const TXT_Username = '#username';
const TXT_Password = '#password';
var url = dev.serviceUrl;

class Login {
  login(username)
  {
    cy.fixture('login').then((data) => {
        cy.visit(url);
        cy.get(TXT_Username).type(username);
        cy.get(TXT_Password).type(data.password, { log: false });
      });

      cy.get(BTN_Submit).click();
  }
}
export default Login;