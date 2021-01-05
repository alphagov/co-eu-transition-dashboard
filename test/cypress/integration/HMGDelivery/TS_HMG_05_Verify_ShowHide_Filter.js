import Navigation from '../../pages/Navigation';
import Login from '../../pages/Login';
import HMGDelivery from '../../pages/HMGDelivery'
import Filters from '../../pages/Filters'

const nav = new Navigation(); 
const login = new Login();
const hmg = new HMGDelivery();
const fil = new Filters();

const department = 'BEIS,HMRC';

beforeEach(() => {
  // Preserve session across the entire test.
  Cypress.Cookies.preserveOnce('jwt');
});

describe("TS_HMG_05_Verify_ShowHide_Filter - As a Management Overivew I can Hide/Show filters", () => {
  before(() => {
  });

  //Log into Dashboard 
  it("Can Login into Dashboard as an 'Management and Overview & Viewer' User", function () {
    //Add relevant roles and department
    cy.addroles("viewer,all_data,management,management_overview");  
    cy.addDepartments(department);
    login.login();
  });

  it("Can not view Filter Panel on 'Hide Filter'", function () {
    nav.selectMainmenu(nav.Menu_HMG_delivery_megmt_info);
    hmg.verifyProjectDataHeader(department);
    fil.hideFilter();
  });

  it("Can view Filter Panel on 'Show Filter'", function () {
    fil.showFilter();
  });
  
}); 