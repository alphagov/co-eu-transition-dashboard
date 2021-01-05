const H2_NOOFPROJECTS = ".govuk-heading-m";
const DIV_PRJ_ACCORDIAN_XP = "//div[@class='govuk-accordion__section-header']";
const DIV_MILESTNE_EXPANDED_XP = "div[@class='govuk-accordion__section govuk-accordion__section--expanded']";
const DIV_MILSTNE_COLLAPSED_XP = "div[@class='govuk-accordion__section']";
const DIV_MILSTNE_TBL_XP = "//div[starts-with(@id,'accordion-table-content-')]";
const DIV_PROJECT_ACCORIDAN = "#accordion-table button[class='govuk-accordion__open-all']";
const TXT_OPENALL = "Open all sections" ;
const TXT_CLOSEALL = "Close all sections";

class HMGDelivery {
  verifyProjectDataHeader(department)
  {
    if (department.split(',').length > 1)
    {
      cy.xpath("//h1[text()='All project data']").should('exist');
    }
    else
    {
      cy.xpath("//h1[text()='" + department + " project data']").should('exist');
    }
  }

  verifyPojectData(department)
  {
    let prjlist = [];
    cy.getProjectData(department).as('dbResultPrjData');
    cy.get('@dbResultPrjData').then((res) => {
      prjlist = res[1];
      cy.log(prjlist);
      cy.get(H2_NOOFPROJECTS).contains(prjlist.length + " Projects displayed");
      prjlist.forEach(element => {
        let projName = element.title
        let departmentdb = element.department_name
        let impact = element.impact
        let HMGConfidence = element.HMGConfidence
        let CitizenReadiness = element.CitizenReadiness
        let BusinessReadiness = element.BusinessReadiness
        let EUStateConfidence = element.EUStateConfidence
        let department_Xpath = "";
        if(department=="All" || department.split(',').length > 1)
        {
          department_Xpath = "/following-sibling::td[.='" + departmentdb + "']";
        }
        cy.xpath("//tr//td[.=\"" + projName + "\"]" + department_Xpath + "\
        /following-sibling::td[.='" + impact + "']/span[@class='cell-color-" + impact + "']\
        /../following-sibling::td[.='" + HMGConfidence + "']/span[@class='cell-color-" + HMGConfidence + "']\
        /../following-sibling::td[.='" + CitizenReadiness + "']/span[@class='cell-color-" + CitizenReadiness + "']\
        /../following-sibling::td[.='" + BusinessReadiness + "']/span[@class='cell-color-" + BusinessReadiness + "']\
        /../following-sibling::td[.='" + EUStateConfidence + "']/span[@class='cell-color-" + EUStateConfidence + "']").should('exist');
      });
    })
  } 

  verifyPojectDataOnProjArry(department, prjListArry)
  {
    cy.get(H2_NOOFPROJECTS).contains(prjListArry.length + " Projects displayed");
    prjListArry.forEach(element => {
      let projName = element.title
      let departmentdb = element.department_name
      let impact = element.impact
      let HMGConfidence = element.HMGConfidence
      let CitizenReadiness = element.CitizenReadiness
      let BusinessReadiness = element.BusinessReadiness
      let EUStateConfidence = element.EUStateConfidence
      let department_Xpath = "";
      if(department=="All" || department.split(',').length > 1)
      {
        department_Xpath = "/following-sibling::td[.='" + departmentdb + "']";
      }
      cy.xpath("//tr//td[.=\"" + projName + "\"]" + department_Xpath + "\
      /following-sibling::td[.='" + impact + "']/span[@class='cell-color-" + impact + "']\
      /../following-sibling::td[.='" + HMGConfidence + "']/span[@class='cell-color-" + HMGConfidence + "']\
      /../following-sibling::td[.='" + CitizenReadiness + "']/span[@class='cell-color-" + CitizenReadiness + "']\
      /../following-sibling::td[.='" + BusinessReadiness + "']/span[@class='cell-color-" + BusinessReadiness + "']\
      /../following-sibling::td[.='" + EUStateConfidence + "']/span[@class='cell-color-" + EUStateConfidence + "']").should('exist');
    });
  } 

  verifyNoOfPojectDisplayed(department)
  {
    let prjlist = [];
    cy.getProjectData(department).as('dbResultPrjData');
    cy.get('@dbResultPrjData').then((res) => {
      prjlist = res[1];
      cy.log(prjlist);
      cy.get(H2_NOOFPROJECTS).contains(prjlist.length + " Projects displayed");
    });
  }

  openProjectAccordian(){
    let regexp = new RegExp("^" + TXT_OPENALL + "$");
    cy.get(DIV_PROJECT_ACCORIDAN).then( ($ele) =>
    { 
      if ($ele.text().match(regexp)) {
        // yup found it
        cy.get(DIV_PROJECT_ACCORIDAN).should('have.attr','aria-expanded','false');
        cy.get(DIV_PROJECT_ACCORIDAN).click();
        cy.get(DIV_PROJECT_ACCORIDAN).should('have.attr','aria-expanded','true');

      } else {
        cy.get(DIV_PROJECT_ACCORIDAN).should('have.attr','aria-expanded','true');
      }
    });
  }

  closeProjectAccordian()
  {
    let regexp = new RegExp("^" + TXT_CLOSEALL + "$");
    cy.get(DIV_PROJECT_ACCORIDAN).then( ($ele) =>
    {
      if ($ele.text().match(regexp)) {
        // yup found it
        cy.get(DIV_PROJECT_ACCORIDAN).should('have.attr','aria-expanded','true');
        cy.get(DIV_PROJECT_ACCORIDAN).click();
        cy.get(DIV_PROJECT_ACCORIDAN).should('have.attr','aria-expanded','false');

      } else {
        cy.get(DIV_PROJECT_ACCORIDAN).should('have.attr','aria-expanded','false');
      }
    });
  }

  verifyNoMilestoneData(projUid,department)
  {
    let mileslist = [];
    cy.getMilestoneData(projUid,department).as('dbResultMilesData');
    cy.get('@dbResultMilesData').then((mls) => {
      mileslist = mls[2];
      mileslist.forEach(mlsele => {
        cy.xpath(DIV_PRJ_ACCORDIAN_XP + "//td[.=\"" + mlsele.title + "\"]\
        /a[@href='/project-details/" + mlsele.project_uid + "']/ancestor::" + DIV_MILSTNE_COLLAPSED_XP 
        + DIV_MILSTNE_TBL_XP).xpath(".//tr[starts-with(normalize-space(.),'" 
        + mlsele.uid.replace(/\s+/g, ' ').trim() + "')]").should('have.prop','offsetHeight',0);
      });
    });
  }

  verifyMilestoneData(projUid,department)
  {
    let mileslist = [];
    cy.getMilestoneData(projUid,department).as('dbResultMilesData');
    cy.get('@dbResultMilesData').then((mls) => {
      mileslist = mls[2];
      mileslist.forEach(mlsele => {
        cy.xpath(DIV_PRJ_ACCORDIAN_XP + "//td[.=\"" + mlsele.title + "\"]\
        /a[@href='/project-details/" + mlsele.project_uid + "']/ancestor::" + DIV_MILESTNE_EXPANDED_XP + DIV_MILSTNE_TBL_XP).xpath(".//tr").contains(
          (mlsele.uid + " " 
          + mlsele.description + " " 
          + mlsele.duedate + " "
          + mlsele.Complete + " " 
          + mlsele.LastComment ).replace(/\s+/g, ' ').trim());
      });
    });
  }
}
export default HMGDelivery;