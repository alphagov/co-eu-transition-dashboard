import Navigation from '../../Pages/Navigation';
import Login from '../../Pages/Login';
//const logger = require('middleware/logger');
const nav = new Navigation(); 
const login = new Login();

const username = "cy_auto@test.com";

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

describe("Workflow for 'Admin' with all other User roles - Verify accessible Menus", () => {
  before(() => {
    //Setup
    testCleanup();
    testSetup();
    //Catch Exceptions 
    cy.on('uncaught:exception', () => {
      //logger.error("Error Caught");
      return false;
    });
  
  });

  //Log into Dashboard 
  it("Can Login into Dashboard as an 'Admin' Userwith all roles", function () {
    //Add Admin role to user
    addrole("admin");
    //Add all data role to user
    addrole("all_data");
    addrole("uploader");
    addrole("viewer");
    addrole("management_overview");
    addrole("management");
    //Add department to user
    addDepartment("BEIS");

    login.login(username);
    
  });

  //Verify that I am allowed to access 'Tranistion Readiness' menu and all submenus underneath
  it("Can see and access 'Tranistion Readiness' menu and all submenus underneath", function () {
    nav.selectMainmenu(nav.Menu_Tranistion_Readiness);
    nav.verifySubmenu(nav.SubMenu_Overview);
    nav.verifyAllThemes();
  });

  //Verify that I am allowed to access 'HMG delivery management information' menu and all submenus underneath
  it("Can see and access 'HMG delivery management information' menu and all submenus underneath", function () {
    nav.selectMainmenu(nav.Menu_HMG_delivery_megmt_info);
    nav.verifySubmenu(nav.SubMenu_Reporting_overview);
    nav.verifySubmenu(nav.SubMenu_Alldata);
    nav.verifySubmenu(nav.SubMenu_Missedmilestones);
    nav.verifySubmenu(nav.SubMenu_Upcomingmilestones);
  });

  //Verify that I am allowed to access 'Add data' menu and all submenus underneath
  it("Can see and access 'Add data' menu and all submenus underneath", function () {
    nav.selectMainmenu(nav.Menu_Adddata);
    nav.verifySubmenu(nav.SubMenu_Managementinformation);
    nav.verifySubmenu(nav.SubMenu_Measures);
  });

  //Verify that I am allowed to access 'Admin' mneu and all submenus underneath
  it("Can see and access 'Admin' menu and all submenus underneath", function () {
    nav.selectMainmenu(nav.Menu_Admin);
    nav.verifySubmenu(nav.SubMenu_MIdatastructure);
    nav.verifySubmenu(nav.SubMenu_Managecategories);
    nav.verifySubmenu(nav.SubMenu_ManageHeadlineMeasures);
    nav.verifySubmenu(nav.SubMenu_ManageUsers);
    nav.verifySubmenu(nav.SubMenu_Entitydataimport);
    nav.verifySubmenu(nav.SubMenu_StaticExport);
    nav.verifySubmenu(nav.SubMenu_RAYGValues);
  });

});