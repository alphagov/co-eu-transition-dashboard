//Headers
const H1_OVERVIEWPAGE_HEADER = "//h1[text()='Transition Readiness Overview";
const Link_RAYG_Definition = "//a[text()='View RAYG definitions and how they are calculated";
const MAIN_MENU = "li a[class='govuk-header__link nav']";
const SUB_MENU = "li a[class='govuk-header__link child-nav']";

//Main Menus
const MENU_TRANISTION_READINESS = "Transition readiness";
const MENU_HMG_DELIVERY_MEGMT_INFO = "HMG delivery management information";
const MENU_ADD_DATA = "Add data";
const MENU_ADMIN = "Admin";

//Sub Menus Tranistion Readiness
const SUBMENU_OVERVIEW = "Overview";

//Sub Menus HMG
const SUBMENU_REPORTING_OVERVIEW = "Reporting overview";
const SUBMENU_ALLDATA = "All data";
const SUBMENU_MISSED_MILESTONES = "Missed milestones";
const SUBMENU_UPCOMING_MILESTONES = "Upcoming milestones";

//Sub Menus Add data
const SUBMENU_MANAGEMENT_INFORMATION = "Management information";
const SUBMENU_MEASURES = "Measures";

//Sub Menus Admin
const SUBMENU_MI_DATA_STRUCTURE = "MI data structure";
const SUBMENU_MANAGE_CATEGORIES = "Manage categories";
const SUBMENU_MANAGE_HEADLINE_MEASURES = "Manage Headline Measures";
const SUBMENU_MANAGE_USERS = "Manage Users";
const SUBMENU_ENTITY_DATAIMPORT = "Entity data import";
const SUBMENU_STATIC_EXPORT = "Static Export";
const SUBMENU_RAYG_VALUES = "RAYG Values";
const SUBMENU_MANAGE_TAGS = "Manage Tags";
const SUBMENU_PERMISSIONS = "Permissions";
const SUBMENU_MANAGE_ENTITIES = "Manage Entities";

class Navigation {
//Menus
  get menuTranistionReadiness() {
    return MENU_TRANISTION_READINESS;
  }
  get menuHMGdeliverymegmtinfo() {
    return MENU_HMG_DELIVERY_MEGMT_INFO;
  }
  get menuAdddata() {
    return MENU_ADD_DATA;
  }
  get menuAdmin() {
    return MENU_ADMIN;
  }

  //Sub Menus Tranistion Readiness
  get subMenuOverview() {
    return SUBMENU_OVERVIEW;
  }

  //Sub Menus HMG
  get subMenuReportingOverview() {
    return SUBMENU_REPORTING_OVERVIEW;
  }
  get subMenuAlldata() {
    return SUBMENU_ALLDATA;
  }
  get subMenuMissedMilestones() {
    return SUBMENU_MISSED_MILESTONES;
  }
  get subMenuUpcomingMilestones() {
    return SUBMENU_UPCOMING_MILESTONES;
  }

  //Sub Menus Add data
  get subMenuManagementInformation() {
    return SUBMENU_MANAGEMENT_INFORMATION;
  }
  get SubMenu_Measures() {
    return SUBMENU_MEASURES;
  }
  //Sub Menus Admin
  get subMenuMIDataStructure() {
    return SUBMENU_MI_DATA_STRUCTURE;
  }
  get subMenuManageCategories() {
    return SUBMENU_MANAGE_CATEGORIES;
  }
  get subMenuManageHeadlineMeasures() {
    return SUBMENU_MANAGE_HEADLINE_MEASURES;
  }
  get subMenuManageUsers() {
    return SUBMENU_MANAGE_USERS;
  }
  get subMenuEntitydataimport() {
    return SUBMENU_ENTITY_DATAIMPORT;
  }
  get subMenuStaticExport() {
    return SUBMENU_STATIC_EXPORT;
  }
  get subMenuRAYGValues() {
    return SUBMENU_RAYG_VALUES;
  }
  get subMenuManageTags() {
    return SUBMENU_MANAGE_TAGS;
  }
  get subMenuPermissions()
  {
    return SUBMENU_PERMISSIONS
  }
  get subMenuManageEntities()
  {
    return SUBMENU_MANAGE_ENTITIES
  }

  //Select Main menu
  selectMainmenu(menuname) {
    cy.get(MAIN_MENU).contains(menuname).click();
  }

  //Select sub menu
  selectSubmenu(submenuname) {
    cy.get(SUB_MENU).contains(submenuname).click();
  }

  //Select Main menu
  verifyMainmenu(menuname) {
    cy.get(MAIN_MENU).contains(menuname).should('exist');
  }

  //Select Main menu
  verifyMainmenuNotExist(menuname) {
    cy.get(MAIN_MENU).contains(menuname).should('not.exist');
  }

  //Select sub menu
  verifySubmenu(submenuname) {
    cy.get(SUB_MENU).contains(submenuname).should('exist');
  }

  verifyOverviewPage() {
    cy.xpath(H1_OVERVIEWPAGE_HEADER).should('exist');
    cy.xpath(Link_RAYG_Definition).should('exist');
  }

  verifyAllThemes() {
    let allThemes = [];
    cy.getallThemes().as('dbResultAllThemes');
    cy.get('@dbResultAllThemes').then((res) => {
      allThemes = res
      allThemes.forEach(element => {
        cy.xpath("//li/a[normalize-space() = '" + element.value + "']").should('exist');
      });
    })
  }

  verifyDAThemes() {
    let daThemes = [];
    cy.getDAThemes().as('dbResultDAThemes');
    cy.get('@dbResultDAThemes').then((res) => {
      daThemes = res
      daThemes.forEach(element => {
        cy.xpath("//li/a[normalize-space() = '" + element.value + "']").should('exist');
      });
    })
  }

  verifyNonDAThemes() {
    let nondaThemes = [];
    cy.getNonDAThemes().as('dbResultNonDAThemes');
    cy.get('@dbResultNonDAThemes').then((res) => {
      nondaThemes = res
      nondaThemes.forEach(element => {
        cy.xpath("//li/a[normalize-space() = '" + element.value + "']").should('not.exist');
      });
    })
  }
}
export default Navigation;