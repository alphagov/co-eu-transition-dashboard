import Navigation from '../../pages/Navigation';
import Login from '../../pages/Login';
import HMGDelivery from '../../pages/HMGDelivery'

const nav = new Navigation(); 
const login = new Login();
const hmg = new HMGDelivery();

const username = "cy_auto@test.com";
const department = 'BEIS,HMRC';

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
  if (department == 'All')
  {
    cy.addAllDepartment(username);
  }
  else
  {
    var deplist = department.split(',');
    cy.log(deplist);
    deplist.forEach(depelement => {
      cy.addDepartment(username, depelement);
    });
  }
}

beforeEach(() => {
  // Preserve session across the entire test.
  Cypress.Cookies.preserveOnce('jwt');
});

describe("As a Management Overivew I can View All Milestone Data on all data page", () => {
  before(() => {
    //Setup
    testCleanup();
    testSetup();
    //Catch Exceptions 
    cy.on('uncaught:exception', () => {
      return false;
    });
  
  });

  //Log into Dashboard 
  it("Can Login into Dashboard as an 'Management and Overview & Viewer' User", function () {
    //Add relevant roles
    addrole("viewer");
    addrole("all_data");
    addrole("management");
    addrole("management_overview");  
    addDepartment(department);
    login.login(username);
  });

  it("Can Not view list of All Milestone and when accordian are closed", function () {
    nav.selectMainmenu(nav.Menu_HMG_delivery_megmt_info);
    //nav.selectSubmenu(nav.SubMenu_Alldata)
    hmg.verifyProjectDataHeader(department);
    hmg.closeProjectAccordian();
    hmg.verifyNoMilestoneData('All',department);
  });

  it("Can view list of All Milestone and when accordian are open", function () {
    nav.selectMainmenu(nav.Menu_HMG_delivery_megmt_info);
    //nav.selectSubmenu(nav.SubMenu_Alldata)
    hmg.verifyProjectDataHeader(department);
    hmg.openProjectAccordian();
    hmg.verifyMilestoneData('All',department);
  });

}); 