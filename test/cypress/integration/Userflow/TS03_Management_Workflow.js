import Navigation from '../../Pages/Navigation';
import Login from '../../Pages/Login';
//const logger = require('middleware/logger');
const nav = new Navigation(); 
const login = new Login();

const department = Cypress.config().department.split(',')[0];

beforeEach(() => {
  // Preserve session across the entire test.
  Cypress.Cookies.preserveOnce('jwt');
});

describe("TS03_Management_Workflow - 'Management' with 'Viewer' User role - Verify accessible Menus", () => {
  before(() => {
  });

  //Log into Dashboard 
  it("Can Login into Dashboard as an 'Management & Viewer' User", function () {
    //Add all role to user
    cy.addroles("management,viewer");
    //Add departments to user
    cy.addDepartments(department);
    //Login
    login.login();
  });

  //Verify that I am allowed to access 'Tranistion Readiness' menu and all submenus underneath
  it("Can see and access 'Tranistion Readiness' menu and all submenus underneath", function () {
    nav.selectMainmenu(nav.menuTranistionReadiness);
    nav.verifySubmenu(nav.subMenuOverview);
    nav.verifyAllThemes();
  });

  //Verify that I am allowed to access 'HMG delivery management information' menu and all submenus underneath
  it("Can see and access 'HMG delivery management information' menu and all submenus underneath", function () {
    nav.selectMainmenu(nav.menuHMGdeliverymegmtinfo);
    nav.verifyMainmenuNotExist(nav.subMenuReportingOverview);
    nav.verifySubmenu(nav.subMenuAlldata);
    nav.verifySubmenu(nav.subMenuMissedMilestones);
    nav.verifySubmenu(nav.subMenuUpcomingMilestones);
  });

  //Verify that I am allowed to access 'Add data' menu and all submenus underneath
  it("Can NOT see and access 'Add data' menu and all submenus underneath", function () {
    nav.verifyMainmenuNotExist(nav.menuAdddata);
    nav.verifyMainmenuNotExist(nav.subMenuManagementInformation);
    nav.verifyMainmenuNotExist(nav.SubMenu_Measures);
  });

  //Verify that I am allowed to access 'Admin' mneu and all submenus underneath
  it("Can NOT see and access 'Admin' menu and all submenus underneath", function () {
    nav.verifyMainmenuNotExist(nav.menuAdmin);
    nav.verifyMainmenuNotExist(nav.subMenuMIDataStructure);
    nav.verifyMainmenuNotExist(nav.subMenuManageCategories);
    nav.verifyMainmenuNotExist(nav.subMenuManageHeadlineMeasures);
    nav.verifyMainmenuNotExist(nav.subMenuManageUsers);
    nav.verifyMainmenuNotExist(nav.subMenuEntitydataimport);
    nav.verifyMainmenuNotExist(nav.subMenuStaticExport);
    nav.verifyMainmenuNotExist(nav.subMenuRAYGValues);
    nav.verifyMainmenuNotExist(nav.subMenuManageTags);
    nav.verifyMainmenuNotExist(nav.subMenuPermissions);
    nav.verifyMainmenuNotExist(nav.subMenuManageEntities);
  });
});