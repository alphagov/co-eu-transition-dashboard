const dev = require('../../../config/development.json')

//Login Control
const BTN_Submit = 'button.govuk-button';
const TXT_Username = '#username';
const TXT_Password = '#password';
const Logout_link = "ul[class^='govuk-header__navigation'][aria-label='Logout Link'] a[href='/logout']";
const MainHeader_link = "a[class='govuk-header__link govuk-header__link--service-name']";
const TXT_TransitionReadinessDashboard = "Transition Readiness Dashboard";

var url = dev.serviceUrl;

class Login {
  login(username) {
    cy.fixture('login').then((data) => {
      cy.visit(url);
      cy.get(TXT_Username).type(username);
      cy.get(TXT_Password).type(data.password, { log: false });
    });

    cy.get(BTN_Submit).click();
    this.verifyLogoutlink();
    this.verifyMainHeaderlink();
  }

  verifyLogoutlink() {
    cy.get(Logout_link).should('exist');
  }

  verifyMainHeaderlink() {
    cy.get(MainHeader_link).contains(TXT_TransitionReadinessDashboard).should('exist');
  }

}
export default Login;