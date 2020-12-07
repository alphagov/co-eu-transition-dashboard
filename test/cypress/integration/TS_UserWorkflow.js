import Navigation from '../Pages/Navigation';
import Login from '../Pages/Login';
const nav = new Navigation(); 
const login = new Login();

const username = "cy_auto@test.com";;

function testSetup() {
  //Create User
  cy.createuser(username).as('dbResultUserID');
}

function testCleanup() {
  //Create User
  cy.deleteuser(username).as('dbResultUserID');
}

function addrole(rolename) {
  cy.addrole(username, rolename);
}

function addDepartment(department) {
  cy.addDepartment(username, department);
}

beforeEach(() => {
  // Preserve session across the entire test.
  Cypress.Cookies.preserveOnce('jwt');
});

describe('Verify accessible Menus as an Admin User', () => {
  before(() => {
    //Setup
    testCleanup();
    testSetup();
    //Catch Exceptions 
    cy.on('uncaught:exception', (err) => {
      console.log("Error Caught");
      return false;
    });
  
  });

  //Log into Dashboard 
  it("Can Login into Dashboard as an Admin User", function () {
    //Add Admin role to user
    addrole("admin");
    //Add all data role to user
    addrole("all_data");
    addrole("devolved_administrations");
    //Add department to user
    addDepartment("BEIS");

    login.login(username);
    
  });

  //Verify that I am allowed to access all menus
  it("I can see and access 'Tranistion Readiness' and all submenus underneath", function () {
    nav.selectMainmenu(Navigation.Menu_Tranistion_Readiness);
    nav.selectSubmenu(Navigation.SubMenu_Overview);
    //nav.verifyAllThemes();
  });

});