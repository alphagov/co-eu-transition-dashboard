const H2_NoOfProjects = ".govuk-heading-m";

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

}
export default HMGDelivery;