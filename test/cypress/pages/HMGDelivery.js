const H2_NoOfProjects = ".govuk-heading-m";
const DIV_Prj_Accordian_Xp = "//div[@class='govuk-accordion__section-header']";
const DIV_Milstne_Expanded_Xp = "div[@class='govuk-accordion__section govuk-accordion__section--expanded']";
const DIV_Milstne_Collapsed_Xp = "div[@class='govuk-accordion__section']";
const DIV_Milstne_Tbl_Xp = "//div[starts-with(@id,'accordion-table-content-')]";
const DIV_ProjectAccoridan = "#accordion-table button[class='govuk-accordion__open-all']";
const TXT_Openall = "Open all sections" ;
const TXT_Closeall = "Close all sections";

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
    var prjlist = [];
    cy.getProjectData(department).as('dbResultPrjData');
    cy.get('@dbResultPrjData').then((res) => {
      prjlist = res[1];
      cy.log(prjlist);
      cy.get(H2_NoOfProjects).contains(prjlist.length + " Projects displayed");
      prjlist.forEach(element => {
        var projName = element.title
        var departmentdb = element.department_name
        var impact = element.impact
        var HMGConfidence = element.HMGConfidence
        var CitizenReadiness = element.CitizenReadiness
        var BusinessReadiness = element.BusinessReadiness
        var EUStateConfidence = element.EUStateConfidence
        var department_Xpath = "";
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

  openProjectAccordian(){
    var regexp = new RegExp("^" + TXT_Openall + "$");
    cy.get(DIV_ProjectAccoridan).then( ($ele) =>
    { 
      if ($ele.text().match(regexp)) {
        // yup found it
        cy.get(DIV_ProjectAccoridan).should('have.attr','aria-expanded','false');
        cy.get(DIV_ProjectAccoridan).click();
        cy.get(DIV_ProjectAccoridan).should('have.attr','aria-expanded','true');

      } else {
        cy.get(DIV_ProjectAccoridan).should('have.attr','aria-expanded','true');
      }
    });
  }

  closeProjectAccordian()
  {
    var regexp = new RegExp("^" + TXT_Closeall + "$");
    cy.get(DIV_ProjectAccoridan).then( ($ele) =>
      {
        if ($ele.text().match(regexp)) {
          // yup found it
          cy.get(DIV_ProjectAccoridan).should('have.attr','aria-expanded','true');
          cy.get(DIV_ProjectAccoridan).click();
          cy.get(DIV_ProjectAccoridan).should('have.attr','aria-expanded','false');

        } else {
          cy.get(DIV_ProjectAccoridan).should('have.attr','aria-expanded','false');
        }
      });
  }

  verifyNoMilestoneData(projUid,department)
  {
    var mileslist = [];
    cy.getMilestoneData(projUid,department).as('dbResultMilesData');
    cy.get('@dbResultMilesData').then((mls) => {
      mileslist = mls[2];
      mileslist.forEach(mlsele => {
        cy.xpath(DIV_Prj_Accordian_Xp + "//td[.=\"" + mlsele.title + "\"]\
        /a[@href='/project-details/" + mlsele.project_uid + "']/ancestor::" + DIV_Milstne_Collapsed_Xp 
        + DIV_Milstne_Tbl_Xp).xpath(".//tr[starts-with(normalize-space(.),'" 
        + mlsele.uid.replace(/\s+/g, ' ').trim() + "')]").should('have.prop','offsetHeight',0);
      });
    });
  }

  verifyMilestoneData(projUid,department)
  {
    var mileslist = [];
    cy.getMilestoneData(projUid,department).as('dbResultMilesData');
    cy.get('@dbResultMilesData').then((mls) => {
      mileslist = mls[2];
      mileslist.forEach(mlsele => {
        cy.xpath(DIV_Prj_Accordian_Xp + "//td[.=\"" + mlsele.title + "\"]\
        /a[@href='/project-details/" + mlsele.project_uid + "']/ancestor::" + DIV_Milstne_Expanded_Xp + DIV_Milstne_Tbl_Xp).xpath(".//tr").contains(
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