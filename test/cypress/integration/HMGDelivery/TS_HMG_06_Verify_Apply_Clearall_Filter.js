import Navigation from '../../pages/Navigation';
import Login from '../../pages/Login';
import HMGDelivery from '../../pages/HMGDelivery'
import Filters from '../../pages/Filters'

const nav = new Navigation(); 
const login = new Login();
const hmg = new HMGDelivery();
const fil = new Filters();

const department = Cypress.config().department;
let randomPrjArray = [];

beforeEach(() => {
  // Preserve session across the entire test.
  Cypress.Cookies.preserveOnce('jwt');
});

describe("TS_HMG_06_Verify_Apply_Clearall_Filter - As a Management Overivew user I can Select/Unselect Filters and Apply/Clear All filters", () => {
  before(() => {
    cy.getRandomProject(department).as('dbResultPrjData');
    cy.get('@dbResultPrjData').then((res) => {
      randomPrjArray = res[1];
    });
  });

  //Log into Dashboard 
  it("Can Login into Dashboard as an 'Management and Overview & Viewer' User", function () {
    //Add relevant roles and department
    cy.addroles("viewer,all_data,management,management_overview");  
    cy.addDepartments(department);
    login.login();
  });

  it("Can Apply filter on 'Selecting all filter types' and verify that only filtered result displayed", function () {
    nav.selectMainmenu(nav.Menu_HMG_delivery_megmt_info);
    hmg.verifyProjectDataHeader(department);
    fil.openFilterAccordian();
    fil.selectAllProjectFilters(randomPrjArray);
    fil.applyFilter();
    fil.verifyAllSelectedProjectFilters(randomPrjArray);
    hmg.verifyPojectDataOnProjArry(department, randomPrjArray);
  });

  it("Can Apply filter on 'Unselecting all filter types' and verify that all results displayed", function () {
    fil.openFilterAccordian();
    fil.unselectAllProjectFilters(randomPrjArray);
    fil.applyFilter();
    fil.verifyNoFilterPanel();
    hmg.verifyNoOfPojectDisplayed(department);
  });
  
  it("Can 'Clear all filters' after 'Selecting/Applying all filter types' and verify that all results displayed", function () {
    fil.openFilterAccordian();
    fil.selectAllProjectFilters(randomPrjArray);
    fil.applyFilter();
    fil.clearFilter();
    fil.verifyNoFilterPanel();
    hmg.verifyNoOfPojectDisplayed(department);
  });

}); 