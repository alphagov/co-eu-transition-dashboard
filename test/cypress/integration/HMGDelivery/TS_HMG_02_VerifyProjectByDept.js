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

describe("TS_HMG_02_VerifyProjectByDept - As a Management Overivew I can View All Project Data", () => {
  before(() => {
  });

  //Log into Dashboard 
  it("Can Login into Dashboard as an 'Management and Overview & Viewer' User", function () {
    //Add relevant roles
    cy.addroles("viewer,all_data,management,management_overview");  
    cy.addDepartments(department);
    login.login();
  });

  it("Can view list of All Project and and all relevant fiedl valus on list page (Including no. of project)", function () {
    nav.selectMainmenu(nav.menuHMGdeliverymegmtinfo);
    nav.selectSubmenu(nav.subMenuAlldata)
    hmg.verifyProjectDataHeader(department);
    hmg.verifyPojectData(department);
  });

}); 