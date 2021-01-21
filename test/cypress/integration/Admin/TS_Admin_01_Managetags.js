import Navigation from '../../pages/Navigation';
import Login from '../../pages/Login';
import Admin from '../../pages/Admin';

const nav = new Navigation(); 
const login = new Login();
const admin = new Admin();
const department = Cypress.config().department.split(',')[0];

beforeEach(() => {
  // Preserve session across the entire test.
  Cypress.Cookies.preserveOnce('jwt');
});

describe("TS_Admin_01_Managetags - As an admin I can Manage(Create/Delete) tags", () => {
  before(() => {
  });

  //Log into Dashboard 
  it("Can Login into Dashboard as an 'Admin' Userwith all roles", function () {
    //Add all role to user
    cy.addroles("admin,all_data,uploader,viewer,management_overview,management");
    //Add departments to user
    cy.addDepartments(department);
    //Login
    login.login();
  });

  //Verify that I am allowed to access 'Tranistion Readiness' menu and all submenus underneath
  it("Can view list of Tags and 'Delete' link against each of them", function () {
    nav.selectMainmenu(nav.menuAdmin);
    nav.selectSubmenu(nav.subMenuManageTags)
    admin.verifyManageTagsHeader();
    admin.verifyTagList();
  });

  it("Can view list of measures tagged on Delete tag confirmation for relevant tag", function () {
    nav.selectMainmenu(nav.menuAdmin);
    nav.selectSubmenu(nav.subMenuManageTags)
    let taglist = [];
    cy.getTagList().as('dbResultTagList');
    cy.get('@dbResultTagList').then((res) => {
      taglist = res
      taglist.forEach(element => {
        admin.verifyListedMeasureOnDelete(element.name);
      });
    })
  });

});