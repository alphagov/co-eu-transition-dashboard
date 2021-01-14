import Navigation from '../../pages/Navigation';
import Login from '../../pages/Login';
import HMGDelivery from '../../pages/HMGDelivery'

const nav = new Navigation(); 
const login = new Login();
const hmg = new HMGDelivery();

const { department } = Cypress.config();

beforeEach(() => {
  // Preserve session across the entire test.
  Cypress.Cookies.preserveOnce('jwt');
});

describe("TS_HMG_04_VerifyMilestonesByDept - As a Management Overivew I can View All Milestone Data on all data page", () => {
  before(() => {
  });

  //Log into Dashboard 
  it("Can Login into Dashboard as an 'Management and Overview & Viewer' User", function () {
    //Add relevant roles and department
    cy.addroles("viewer,all_data,management,management_overview");  
    cy.addDepartments(department);
    login.login();
  });

  it("Can Not view list of All Milestone and when accordian are closed", function () {
    nav.selectMainmenu(nav.menuHMGdeliverymegmtinfo);
    hmg.verifyProjectDataHeader(department);
    hmg.closeProjectAccordian();
    hmg.verifyNoMilestoneData('All',department);
  });

  it("Can view list of All Milestone and when accordian are open", function () {
    nav.selectMainmenu(nav.menuHMGdeliverymegmtinfo);
    hmg.verifyProjectDataHeader(department);
    hmg.openProjectAccordian();
    hmg.verifyMilestoneData('All',department);
  });
  
}); 