const dev = require ('../../../config/development.json')
const BTN_Submit = 'button.govuk-button';
const TXT_Username = '#username';
const TXT_Password = '#password';

describe('Forecast of Events', () => {
    beforeEach(() => {
  
      //Catch Exceptions 
      cy.on('uncaught:exception', (err) => {
        console.log("Error Caught");
        return false;
      });
  
    
    });
  
    //Log into Dashboard 
    it("Can log into Dashboar", function () {
         var url = dev.serviceUrl;
         //Create User
        cy.createuser().as('dbResultUserID');
      
        cy.fixture('login').then((data) => {
          cy.visit(url);
          cy.get(TXT_Username).type(data.username);
          cy.get(TXT_Password).type(data.password, { log: false });
        });
      
        cy.get(BTN_Submit).click();
        cy.wait(2000);
    });
});