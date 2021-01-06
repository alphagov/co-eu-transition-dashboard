const H1_MANAGETAGS_XP = "//h1[text()='Manage Tags']";
const TH_TAGNAME_XP = "//table//th[text()='Name']";
const LINK_DELETE_XP = "//td/a[text()='Delete']";
const LINK_BACKTO_TAGLIST_XP = "//a[normalize-space(.)='Back to tag list']";
const TABLE_CONFIRM_DELETE_MEASURE = ".govuk-table";

class Admin {
  verifyManageTagsHeader()
  {
    cy.xpath(H1_MANAGETAGS_XP).should('exist');
  }

  clickBackToTagList()
  {
    cy.xpath(LINK_BACKTO_TAGLIST_XP).click();
  }

  verifyTagList()
  {
    cy.xpath(TH_TAGNAME_XP).should("exist");
    let taglist = [];
    cy.getTagList().as('dbResultTagList');
    cy.get('@dbResultTagList').then((res) => {
      taglist = res
      taglist.forEach(element => {
        cy.xpath("//table//tr[contains(.,'" + element.name + "')]" + LINK_DELETE_XP).should('exist');
      });
    })
  }

  verifyListedMeasureOnDelete(tagname)
  {
    
    let measurelist = [];
    cy.getTagedMeasure(tagname).as('dbResudbResultMeasurelistltTagList');
    cy.get('@dbResultMeasurelist').then((res) => {
      cy.xpath("//table//tr[contains(.,'" + tagname+ "')]" + LINK_DELETE_XP).click();
      measurelist = res
      let measure;
      measurelist.forEach(element => {
        measure = element.id.replace(/\s+/g, ' ') + " " + element.name.replace(/\s+/g, ' ');
        cy.get(TABLE_CONFIRM_DELETE_MEASURE).find("tr").contains(measure);
      });
      this.clickBackToTagList();
    })
  }
}
export default Admin;