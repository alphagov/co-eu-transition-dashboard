import Navigation from '../../pages/Navigation';
import Login from '../../pages/Login';
import HMGDelivery from '../../pages/HMGDelivery'

const nav = new Navigation(); 
const login = new Login();
const hmg = new HMGDelivery();

const department = 'All';

beforeEach(() => {
  // Preserve session across the entire test.
  Cypress.Cookies.preserveOnce('jwt');
});

describe("As a Management Overivew I can View All Project Data", () => {
  before(() => {
    cy.on('uncaught:exception', () => {
      return false;
    });
  });

  //Log into Dashboard 
  it("Can Login into Dashboard as an 'Management and Overview & Viewer' User", function () {
    //Add relevant roles
    cy.addroles("viewer,all_data,management,management_overview");  
    cy.addDepartments(department);
    login.login();
  });

  it("Can view list of All Project and and all relevant fiedl valus on list page (Including no. of project)", function () {
    nav.selectMainmenu(nav.Menu_HMG_delivery_megmt_info);
    nav.selectSubmenu(nav.SubMenu_Alldata)
    hmg.verifyProjectDataHeader(department);
    hmg.verifyPojectData(department);
  });

}); 