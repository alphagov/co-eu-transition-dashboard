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

class Navigation {
//Menus
  get Menu_Tranistion_Readiness() {
    return MENU_TRANISTION_READINESS;
  }
  get Menu_HMG_delivery_megmt_info() {
    return MENU_HMG_DELIVERY_MEGMT_INFO;
  }
  get Menu_Adddata() {
    return MENU_ADD_DATA;
  }
  get Menu_Admin() {
    return MENU_ADMIN;
  }

  //Sub Menus Tranistion Readiness
  get SubMenu_Overview() {
    return SUBMENU_OVERVIEW;
  }

  //Sub Menus HMG
  get SubMenu_Reporting_overview() {
    return SUBMENU_REPORTING_OVERVIEW;
  }
  get SubMenu_Alldata() {
    return SUBMENU_ALLDATA;
  }
  get SubMenu_Missedmilestones() {
    return SUBMENU_MISSED_MILESTONES;
  }
  get SubMenu_Upcomingmilestones() {
    return SUBMENU_UPCOMING_MILESTONES;
  }

  //Sub Menus Add data
  get SubMenu_Managementinformation() {
    return SUBMENU_MANAGEMENT_INFORMATION;
  }
  get SubMenu_Measures() {
    return SUBMENU_MEASURES;
  }
  //Sub Menus Admin
  get SubMenu_MIdatastructure() {
    return SUBMENU_MI_DATA_STRUCTURE;
  }
  get SubMenu_Managecategories() {
    return SUBMENU_MANAGE_CATEGORIES;
  }
  get SubMenu_ManageHeadlineMeasures() {
    return SUBMENU_MANAGE_HEADLINE_MEASURES;
  }
  get SubMenu_ManageUsers() {
    return SUBMENU_MANAGE_USERS;
  }
  get SubMenu_Entitydataimport() {
    return SUBMENU_ENTITY_DATAIMPORT;
  }
  get SubMenu_StaticExport() {
    return SUBMENU_STATIC_EXPORT;
  }
  get SubMenu_RAYGValues() {
    return SUBMENU_RAYG_VALUES;
  }
  get SubMenu_ManageTags() {
    return SUBMENU_MANAGE_TAGS;
  }

  //Select Main menu
  selectMainmenu(menuname) {
    cy.get(MAIN_MENU).contains(menuname).click();
  }

  //Select sub meny
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

  //Select sub meny
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