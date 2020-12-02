
//Headers
const H1_OverviewPage_Header = "//h1[text()='Transition Readiness Overview";
const Link_RAYG_Definition = "//a[text()='View RAYG definitions and how they are calculated";
const Main_Menu = "li a[class='govuk-header__link nav']";
const Sub_Menu = "li a[class='govuk-header__link child-nav']";

class Navigation {

    //Menus
    static Menu_Tranistion_Readiness = "Transition readiness";
    static Menu_HMG_delivery_megmt_info = "HMG delivery management information";
    static Menu_Adddata = "Add data";
    static Menu_Admin = "Admin";

    //Sub Menus Tranistion Readiness
    static SubMenu_Overview = "Overview";

    //Sub Menus HMG
    static SubMenu_Reporting_overview  = "Reporting overview";
    static SubMenu_Alldata = "All data";
    static SubMenu_Missedmilestones = "Missed milestones";
    static SubMenu_Upcomingmilestones = "Upcoming milestones";

    //Sub Menus Add data
    static SubMenu_ = "Management information";  
    static SubMenu_Managementinformation = "";
    static SubMenu_Measures = "Measures";

    //Sub Menus Admin
    static SubMenu_MIdatastructure = "MI data structure";
    static SubMenu_Managecategories = "Manage categories";
    static SubMenu_ManageHeadlineMeasures = "Manage Headline Measures";
    static SubMenu_ManageUsers = "Manage Users";
    static SubMenu_Entitydataimport = "Entity data import";
    static SubMenu_StaticExport = "Static Export";

    //Select Main menu
    selectMainmenu(menuname)
    {
        cy.log("menuname " + menuname);
        cy.log("this.Main_Menu " + Main_Menu);
        //var regexMenu = new RegExp("/^\s*" + menuname+ "\s*$/");
        //cy.get(Main_Menu).contains(regexMenu).click();
        cy.get(Main_Menu).contains(menuname).click();
    };

    //Select sub meny
    selectSubmenu(submenuname)
    {
        //var regexMenu = new RegExp("^\s*" + submenuname+ "\s*$/");
        //cy.get(Sub_Menu).contains(regexMenu).click();
        cy.get(Sub_Menu).contains(submenuname).click();
    };


    verifyOverviewPage()
    {
        cy.xpath(H1_OverviewPage_Header).should('exist');
        cy.xpath(Link_RAYG_Definition).should('exist');
    }

    verifyAllThemes()
    {
        var allThemes =[];
        cy.getallThemes().as('dbResultAllThemes');
        cy.get('@dbResultAllThemes').then((res) =>
        {
            allThemes = res
            allThemes.forEach(element => 
                {
                    cy.log("element " + element.value);
                    cy.xpath("//li/a[normalize-space() = '" + element.value + "']").click();
                }
            );
        });

    }
}
export default Navigation;