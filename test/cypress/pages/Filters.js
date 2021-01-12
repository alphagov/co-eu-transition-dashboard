const DIV_FILTER_PANEL = "#accordion-filters";
const DIV_ACCORDIAN_FILTER = "#accordion-filters button.govuk-accordion__open-all";
const DIV_ACCORDIAN_FILTER_HEADER = "div.govuk-accordion__section-header";
const DIV_ACCORDIAN_FILTER_CONTENT= "div.govuk-accordion__section-content";
const CHECK_FILTER = "div.govuk-checkboxes__item input[type='checkbox']";
const BUTTON_APPLY_FILTER_XP = "//button[starts-with(normalize-space(text()),'Apply filters')]";
const BUTTON_CLEARALL_FILTER_XP = "//button[starts-with(normalize-space(text()),'Clear all filters')]";
const DL_SELECT_FILTER_PANEL = "dl[class='govuk-summary-list filter-list']";
const DIV_SELECT_FILTER_ROW = "div.govuk-summary-list__row";
const LINK_HIDE_FILTER_XP = "//a[normalize-space(text())='Hide filters']";
const LINK_SHOW_FILTER_XP = "//a[normalize-space(text())='Show filters']";
const TXT_OPENALL = "Open all sections" ;
const TXT_CLOSEALL = "Close all sections";

class Filters {
  openFilterAccordian(){
    let regexp = new RegExp("^" + TXT_OPENALL + "$");
    cy.get(DIV_ACCORDIAN_FILTER).then( ($ele) =>
    { 
      if ($ele.text().match(regexp)) {
        // yup found it
        cy.get(DIV_ACCORDIAN_FILTER).should('have.attr','aria-expanded','false');
        cy.get(DIV_ACCORDIAN_FILTER).click();
        cy.get(DIV_ACCORDIAN_FILTER).should('have.attr','aria-expanded','true');

      } else {
        cy.get(DIV_ACCORDIAN_FILTER).should('have.attr','aria-expanded','true');
      }
    });
  }

  closeFilterAccordian()
  {
    let regexp = new RegExp("^" + TXT_CLOSEALL + "$");
    cy.get(DIV_ACCORDIAN_FILTER).then( ($ele) =>
    {
      if ($ele.text().match(regexp)) {
        // yup found it
        cy.get(DIV_ACCORDIAN_FILTER).should('have.attr','aria-expanded','true');
        cy.get(DIV_ACCORDIAN_FILTER).click();
        cy.get(DIV_ACCORDIAN_FILTER).should('have.attr','aria-expanded','false');

      } else {
        cy.get(DIV_ACCORDIAN_FILTER).should('have.attr','aria-expanded','false');
      }
    });
  }

  checkFilter(filtername, value)
  {
    cy.get(DIV_ACCORDIAN_FILTER_HEADER).contains(filtername).parents(DIV_ACCORDIAN_FILTER_HEADER).next(DIV_ACCORDIAN_FILTER_CONTENT).find(
      CHECK_FILTER + "[value='" + value + "']").then( ($ele) =>
    {
      ($ele.prop( "checked")) ? cy.wrap($ele).should('be.checked') : cy.wrap($ele).check();
    });
  }

  uncheckFilter(filtername, value)
  {
    cy.get(DIV_ACCORDIAN_FILTER_HEADER).contains(filtername).parents(DIV_ACCORDIAN_FILTER_HEADER).next(DIV_ACCORDIAN_FILTER_CONTENT).find(
      CHECK_FILTER + "[value='" + value + "']").then( ($ele) =>    
    {
      ($ele.prop( "checked")) ? cy.wrap($ele).uncheck() : cy.wrap($ele).should('be.unchecked');
    });  
  }

  unselectAllProjectFilters(prjdetailArr)
  {
    this.uncheckFilter("Project Name",prjdetailArr[0].title);
    this.uncheckFilter("Department",prjdetailArr[0].department_name);
    this.uncheckFilter("Impact",prjdetailArr[0].impact);
    this.uncheckFilter("HMG Confidence",prjdetailArr[0].HMGConfidence);
    this.uncheckFilter("Citizen Readiness Confidence",prjdetailArr[0].CitizenReadiness);
    this.uncheckFilter("Business Readiness Confidence",prjdetailArr[0].BusinessReadiness);
    this.uncheckFilter("EU Member State Confidence",prjdetailArr[0].EUStateConfidence);
    this.uncheckFilter("Delivery Theme",prjdetailArr[0].DeliveryTheme);
    this.uncheckFilter("Progress Status",prjdetailArr[0].ProgressStatus);
  }

  selectAllProjectFilters(prjdetailArr)
  {
    this.checkFilter("Project Name",prjdetailArr[0].title);
    this.checkFilter("Department",prjdetailArr[0].department_name);
    this.checkFilter("Impact",prjdetailArr[0].impact);
    this.checkFilter("HMG Confidence",prjdetailArr[0].HMGConfidence);
    this.checkFilter("Citizen Readiness Confidence",prjdetailArr[0].CitizenReadiness);
    this.checkFilter("Business Readiness Confidence",prjdetailArr[0].BusinessReadiness);
    this.checkFilter("EU Member State Confidence",prjdetailArr[0].EUStateConfidence);
    this.checkFilter("Delivery Theme",prjdetailArr[0].DeliveryTheme);
    this.checkFilter("Progress Status",prjdetailArr[0].ProgressStatus);
  }

  verifyAllSelectedProjectFilters(filtervalueArray)
  {
    this.verifyFilterSelectionPanel("Project Name",filtervalueArray[0].title);
    this.verifyFilterSelectionPanel("Department",filtervalueArray[0].department_name);
    this.verifyFilterSelectionPanel("Impact",filtervalueArray[0].impact);
    this.verifyFilterSelectionPanel("HMG Confidence",filtervalueArray[0].HMGConfidence);
    this.verifyFilterSelectionPanel("Citizen Readiness Confidence",filtervalueArray[0].CitizenReadiness);
    this.verifyFilterSelectionPanel("Business Readiness Confidence",filtervalueArray[0].BusinessReadiness);
    this.verifyFilterSelectionPanel("EU Member State Confidence",filtervalueArray[0].EUStateConfidence);
    this.verifyFilterSelectionPanel("Delivery Theme",filtervalueArray[0].DeliveryTheme);
    this.verifyFilterSelectionPanel("Progress Status",filtervalueArray[0].ProgressStatus);
  }

  applyFilter()
  {
    cy.xpath(BUTTON_APPLY_FILTER_XP).click();
  }

  verifyNoFilterPanel()
  {
    cy.get(DL_SELECT_FILTER_PANEL).should('not.contain','Selected filters');
  }

  clearFilter()
  {
    cy.xpath(BUTTON_CLEARALL_FILTER_XP).click();
    cy.get(DL_SELECT_FILTER_PANEL).should('not.contain','Selected filters');
  }

  verifyFilterSelectionPanel(filtername, value)
  {
    cy.get(DL_SELECT_FILTER_PANEL + " " + DIV_SELECT_FILTER_ROW).contains(filtername + " " + value);
  }

  removeFilterFromSelectionPanel(filtername)
  {
    cy.get(DL_SELECT_FILTER_PANEL + " " + DIV_SELECT_FILTER_ROW).contains(filtername).parentsUntil(DIV_SELECT_FILTER_ROW).find(".cross").click();
  }

  hideFilter()
  {
    cy.xpath(LINK_HIDE_FILTER_XP).then( ($ele) =>
    {
      if ($ele.prop('ofsetHeight') != 0) {
        // yup found it
        cy.xpath(LINK_HIDE_FILTER_XP).click();
        cy.get(DIV_FILTER_PANEL).should('have.prop','offsetHeight',0);
      } 
    });
  }

  showFilter()
  {
    cy.xpath(LINK_HIDE_FILTER_XP).then( ($ele) =>
    {
      if ($ele.prop('ofsetHeight') != 0) {
        // yup found it
        cy.xpath(LINK_SHOW_FILTER_XP).click();
        cy.get(DIV_FILTER_PANEL).should('not.have.prop','offsetHeight',0);
      } 
    });
  }
}
export default Filters;