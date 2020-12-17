import Navigation from '../../pages/Navigation';
import Login from '../../pages/Login';
import Admin from '../../pages/Admin';

const nav = new Navigation(); 
const login = new Login();
const admin = new Admin();

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

describe("As an admin I can Manage(Create/Delete) tags", () => {
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
  it("Can view list of Tags and 'Delete' link against each of them", function () {
    nav.selectMainmenu(nav.Menu_Admin);
    nav.selectSubmenu(nav.SubMenu_ManageTags)
    admin.verifyManageTagsHeader();
    admin.verifyTagList();
  });

  it("Can view list of measures tagged on Delete tag confirmation for relevant tag", function () {
    nav.selectMainmenu(nav.Menu_Admin);
    nav.selectSubmenu(nav.SubMenu_ManageTags)
    var taglist = [];
    cy.getTagList().as('dbResultTagList');
    cy.get('@dbResultTagList').then((res) => {
      taglist = res
      taglist.forEach(element => {
        admin.verifyListedMeasureOnDelete(element.name);
      });
    })
  });

});