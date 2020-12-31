//Login Control
const BTN_SUBMIT = 'button.govuk-button';
const TXT_USERNAME = '#username';
const TXT_PASSWORD = '#password';
const LOGOUT_LINK = "ul[class^='govuk-header__navigation'][aria-label='Logout Link'] a[href='/logout']";
const MAINHEADER_LINK = "a[class='govuk-header__link govuk-header__link--service-name']";
const TXT_TRANSITION_READINESS_DASHBOARD = "Transition Readiness Dashboard";
const DIV_DASHBOAR_HEADER = "div.govuk-header__content";

const config = Cypress.config();

class Login {
  login() {
    cy.get(DIV_DASHBOAR_HEADER).then( ($ele) =>
    {
      if ($ele.text().replace(/\s+/g, ' ').trim().match("Transition Readiness Dashboard Logout")) {
        this.verifyLogoutlink();
      }
      else
      {
        cy.fixture('login').then((data) => {
          cy.get(TXT_USERNAME).type(config.username);
          cy.get(TXT_PASSWORD).type(data.password, { log: false });
        });
  
        cy.get(BTN_SUBMIT).click();
        this.verifyLogoutlink();
      }
      this.verifyMainHeaderlink();
    });
  }

  verifyLogoutlink() {
    cy.get(LOGOUT_LINK).should('exist');
  }

  verifyMainHeaderlink() {
    cy.get(MAINHEADER_LINK).contains(TXT_TRANSITION_READINESS_DASHBOARD).should('exist');
  }

}
export default Login;