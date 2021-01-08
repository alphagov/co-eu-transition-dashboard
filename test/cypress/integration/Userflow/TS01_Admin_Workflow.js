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

describe("TS01_Admin_Workflow - 'Admin' with all other User roles - Verify accessible Menus", () => {
  before(() => {
  });

  //Log into Dashboard 
  it("Can Login into Dashboard as an 'Admin' Userwith all roles", function () {
    //Add Admin role to user
    cy.addroles("admin,all_data,uploader,viewer,management_overview,management");
    //Add department to user
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
    nav.verifySubmenu(nav.subMenuReportingOverview);
    nav.verifySubmenu(nav.subMenuAlldata);
    nav.verifySubmenu(nav.subMenuMissedMilestones);
    nav.verifySubmenu(nav.subMenuUpcomingMilestones);
  });

  //Verify that I am allowed to access 'Add data' menu and all submenus underneath
  it("Can see and access 'Add data' menu and all submenus underneath", function () {
    nav.selectMainmenu(nav.menuAdddata);
    nav.verifySubmenu(nav.subMenuManagementInformation);
    nav.verifySubmenu(nav.SubMenu_Measures);
  });

  //Verify that I am allowed to access 'Admin' mneu and all submenus underneath
  it("Can see and access 'Admin' menu and all submenus underneath", function () {
    nav.selectMainmenu(nav.menuAdmin);
    nav.verifySubmenu(nav.subMenuMIDataStructure);
    nav.verifySubmenu(nav.subMenuManageCategories);
    nav.verifySubmenu(nav.subMenuManageHeadlineMeasures);
    nav.verifySubmenu(nav.subMenuManageUsers);
    nav.verifySubmenu(nav.subMenuEntitydataimport);
    nav.verifySubmenu(nav.subMenuStaticExport);
    nav.verifySubmenu(nav.subMenuRAYGValues);
    nav.verifySubmenu(nav.subMenuManageTags);
    nav.verifySubmenu(nav.subMenuPermissions);
    nav.verifySubmenu(nav.subMenuManageEntities);
  });
});