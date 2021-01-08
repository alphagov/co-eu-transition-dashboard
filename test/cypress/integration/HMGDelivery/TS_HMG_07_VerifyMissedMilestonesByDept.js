import Navigation from '../../pages/Navigation';
import Login from '../../pages/Login';
import HMGDelivery from '../../pages/HMGDelivery'
import Filters from '../../pages/Filters'

const nav = new Navigation(); 
const login = new Login();
const hmg = new HMGDelivery();
const fil = new Filters();

const department = 'All';
let theme = "";
let allMilestListArry = [];
let bythemeMilestListArry = [];


beforeEach(() => {
  // Preserve session across the entire test.
  Cypress.Cookies.preserveOnce('jwt');
});


describe("TS_HMG_07_VerifyMissedMilestonesByDept - As a Management Overivew I can View missed Milestone Data for a relevant department", () => {
  before(() => {
    //All Milestones
    cy.getMissedMilestone("All",department,"All").as('dbResultMilesData');
    cy.get('@dbResultMilesData').then((res) =>
    {
      allMilestListArry = res[3];
    });
  
    //Filtered by Theme
    cy.getMissedMilestone("All",department,theme).as('dbResultMilesData');
    cy.get('@dbResultMilesData').then((res) =>
    {
      bythemeMilestListArry = res[3];
    });
  });

  //Log into Dashboard 
  it("Can Login into Dashboard as an 'Management and Overview & Viewer' User", function () {
    //Add relevant roles and department
    cy.addroles("viewer,all_data,management,management_overview");  
    cy.addDepartments(department);
    cy.log(allMilestListArry);
    login.login();
  });

  it("Can view list of All missed Milestone for given department", function () {
    nav.selectMainmenu(nav.menuHMGdeliverymegmtinfo);
    nav.selectSubmenu(nav.subMenuMissedMilestones);
    hmg.verifyMissedMilestones(allMilestListArry);
  });

  it("Can not view Filter Panel on 'Hide Filter'", function () {
    fil.hideFilter();
  });

  it("Can view Filter Panel on 'Show Filter'", function () {
    fil.showFilter();
  });
  it("Can Filter All missed Milestone for department:'"+ department + "' by Theme:'"+ theme + "'", function () {
    //Get theme with maxium milestones
    theme = hmg.getThemewithMaximumMissedMilestone(allMilestListArry);
    fil.openFilterAccordian();
    fil.checkFilter("Delivery Theme", theme);
    fil.applyFilter();
    fil.verifyFilterSelectionPanel("Delivery Theme", theme);
    hmg.verifyMissedMilestones(bythemeMilestListArry);
  });

  it("Can Apply filter on Unselecting Theme:'" + theme + "' and verify that all results displayed for department:'"+ department + "'", function () {
    fil.openFilterAccordian();
    fil.uncheckFilter("Delivery Theme", theme);
    fil.applyFilter();
    fil.verifyNoFilterPanel();
    hmg.verifyMissedMilestones(allMilestListArry);
  });
  
  it("Can 'Clear all filters' after 'Selecting/Applying all filter types' and verify that all results for department:'" + department + "'", function () {
    fil.openFilterAccordian();
    fil.checkFilter("Delivery Theme", theme);
    fil.applyFilter();
    fil.clearFilter();
    fil.verifyNoFilterPanel();
    hmg.verifyMissedMilestones(allMilestListArry);
  });

}); 