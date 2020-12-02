
Cypress.Commands.add('getallThemes', () => {
    getallThemes().as('dbResultAllThemes');
  });

function getallThemes() {
    const query =
      `SELECT ef.value FROM dashboard.entity e
      join dashboard.category c on e.category_id = c.id and c.name = 'Theme'
      join dashboard.entity_field_entry ef on e.id = ef.entity_id 
      join dashboard.category_field cf on ef.category_field_id = cf.id and cf.name = 'name'; `;
      cy.log(query);
    return cy.task('queryDb', query);
  };
