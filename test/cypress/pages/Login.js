const dev = require('../../../config/development.json')

//Login Control
const BTN_Submit = 'button.govuk-button';
const TXT_Username = '#username';
const TXT_Password = '#password';
const Logout_link = "ul[class^='govuk-header__navigation'][aria-label='Logout Link'] a[href='/logout']";
const MainHeader_link = "a[class='govuk-header__link govuk-header__link--service-name']";
const TXT_TransitionReadinessDashboard = "Transition Readiness Dashboard";
const DIV_Dashboar_Header = ".govuk-header__content";

var url = dev.serviceUrl;

class Login {
  login(username) {
    cy.visit(url);
    cy.get(DIV_Dashboar_Header).then( ($ele) =>
    {
      if ($ele.text().trim().match("Transition Readiness Dashboard Logout")) {
        this.verifyLogoutlink();
      }
      else
      {
        cy.fixture('login').then((data) => {
          cy.get(TXT_Username).type(username);
          cy.get(TXT_Password).type(data.password, { log: false });
        });
  
        cy.get(BTN_Submit).click();
        this.verifyLogoutlink();
      }
      this.verifyMainHeaderlink();
    });
  }

  verifyLogoutlink() {
    cy.get(Logout_link).should('exist');
  }

  verifyMainHeaderlink() {
    cy.get(MainHeader_link).contains(TXT_TransitionReadinessDashboard).should('exist');
  }

}
export default Login;