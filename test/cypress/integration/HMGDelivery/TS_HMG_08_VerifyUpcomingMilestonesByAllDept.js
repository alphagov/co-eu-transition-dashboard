import Navigation from '../../pages/Navigation';
import Login from '../../pages/Login';
import HMGDelivery from '../../pages/HMGDelivery'
import Filters from '../../pages/Filters'

const nav = new Navigation(); 
const login = new Login();
const hmg = new HMGDelivery();
const fil = new Filters();

const department = 'All';
let randomMilestoneArry = [];
let allMilestListArry = [];
let defaultDuedateMilestListArry = [];

beforeEach(() => {
  // Preserve session across the entire test.
  Cypress.Cookies.preserveOnce('jwt');
});

describe("TS_HMG_08_VerifyUpcomingMilestonesByAllDept - As a Management Overivew I can View Upcoming Milestone Data for a relevant department", () => {
  before(() => {
    //By default due date from today's date to next 42 days
    cy.getUpcomingMilestone("All","All","All",department,"All","All","All","-1","42").as('dbResultMilesData');
    cy.get('@dbResultMilesData').then((res) =>
    {
      defaultDuedateMilestListArry = res[10];
    });

    //All Milestones
    cy.getUpcomingMilestone("All","All","All",department,"All","All","All","All","All").as('dbResultMilesData');
    cy.get('@dbResultMilesData').then((res) =>
    {
      allMilestListArry = res[10];
      randomMilestoneArry = hmg.getRandomMilestone(allMilestListArry);
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

  it("Can view list of All upcoming Milestone for given departmentf with a Default due date of next 42 days", function () {
    nav.selectMainmenu(nav.menuHMGdeliverymegmtinfo);
    nav.selectSubmenu(nav.subMenuUpcomingMilestones);
    hmg.verifyGroupbyDueDateMilestones(defaultDuedateMilestListArry);
  });

  it("Can view list of All upcoming Milestone for given departmentf with due date of next 42 days removed", function () {
    fil.removeFilterFromSelectionPanel("Showing milestone due dates");
    hmg.verifyGroupbyDueDateMilestones(allMilestListArry);
  });

  it("Can not view Filter Panel on 'Hide Filter'", function () {
    fil.hideFilter();
  });

  it("Can view Filter Panel on 'Show Filter'", function () {
    fil.showFilter();
  });
  it("Can Filter All upcoming Milestone for department:'"+ department + "' by 'All Filters'", function () {
    fil.openFilterAccordian();
    fil.checkFilter("Milestone Delivery Confidence", randomMilestoneArry.DeliveryConfidence);
    fil.checkFilter("Milestone Category", randomMilestoneArry.Category);
    fil.checkFilter("Department", randomMilestoneArry.Department);
    fil.checkFilter("Delivery Theme", randomMilestoneArry.Theme);
    fil.checkFilter("Impact", randomMilestoneArry.ProjectImpact);
    fil.checkFilter("HMG Confidence", randomMilestoneArry.HMGConfidence);
    fil.applyFilter();
    fil.verifyFilterSelectionPanel("Milestone Delivery Confidence", randomMilestoneArry.DeliveryConfidence);
    fil.verifyFilterSelectionPanel("Milestone Category", randomMilestoneArry.Category);
    fil.verifyFilterSelectionPanel("Department", randomMilestoneArry.Department);
    fil.verifyFilterSelectionPanel("Delivery Theme", randomMilestoneArry.Theme);
    fil.verifyFilterSelectionPanel("Impact", randomMilestoneArry.ProjectImpact);
    fil.verifyFilterSelectionPanel("HMG Confidence", randomMilestoneArry.HMGConfidence);
    //Get Filters by Milestones
    cy.getUpcomingMilestone("All",randomMilestoneArry.DeliveryConfidence,randomMilestoneArry.Category,randomMilestoneArry.Department,
      randomMilestoneArry.Theme,randomMilestoneArry.ProjectImpact,randomMilestoneArry.HMGConfidence).as('dbResultMilesData');
    cy.get('@dbResultMilesData').then((res) =>
    {
      const filteredMilestListArry = res[7];
      hmg.verifyGroupbyDueDateMilestones(filteredMilestListArry);
    });
  });

  it("Can Apply filter on Unselecting 'All Filters' and verify that all results displayed for department:'"+ department + "'", function () {
    fil.openFilterAccordian();
    fil.uncheckFilter("Milestone Delivery Confidence", randomMilestoneArry.DeliveryConfidence);
    fil.uncheckFilter("Milestone Category", randomMilestoneArry.Category);
    fil.uncheckFilter("Department", randomMilestoneArry.Department);
    fil.uncheckFilter("Delivery Theme", randomMilestoneArry.Theme);
    fil.uncheckFilter("Impact", randomMilestoneArry.ProjectImpact);
    fil.uncheckFilter("HMG Confidence", randomMilestoneArry.HMGConfidence);
    fil.applyFilter();
    fil.verifyNoFilterPanel();
    hmg.verifyGroupbyDueDateMilestones(allMilestListArry);
  });
  
  it("Can 'Clear all filters' after 'Selecting/Applying all filter types' and verify that all results for department:'" + department + "'", function () {
    fil.openFilterAccordian();
    fil.checkFilter("Milestone Delivery Confidence", randomMilestoneArry.DeliveryConfidence);
    fil.checkFilter("Milestone Category", randomMilestoneArry.Category);
    fil.checkFilter("Department", randomMilestoneArry.Department);
    fil.checkFilter("Delivery Theme", randomMilestoneArry.Theme);
    fil.checkFilter("Impact", randomMilestoneArry.ProjectImpact);
    fil.checkFilter("HMG Confidence", randomMilestoneArry.HMGConfidence);
    fil.applyFilter();
    fil.clearFilter();
    fil.verifyNoFilterPanel();
    hmg.verifyGroupbyDueDateMilestones(allMilestListArry);
  });

}); 