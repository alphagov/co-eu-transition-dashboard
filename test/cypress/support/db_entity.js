//const logger = require('middleware/logger');

Cypress.Commands.add('getallThemes', () => {
  getallThemes().as('dbResultAllThemes');
});

Cypress.Commands.add('getDAThemes', () => {
  getDAThemes().as('dbResultDAThemes');
});

Cypress.Commands.add('getNonDAThemes', () => {
  getNonDAThemes().as('dbResultNonDAThemes');
});

function getallThemes() {
  const query =
    `SELECT ef.value FROM entity e
      join category c on e.category_id = c.id and c.name = 'Theme'
      join entity_field_entry ef on e.id = ef.entity_id 
      join category_field cf on ef.category_field_id = cf.id and cf.name = 'name'; `;
  //logger.info(query);
  return cy.task('queryDb', query);
}

function getDAThemes() {
  const query =
    `SELECT ef.value FROM entity e
      join category c on e.category_id = c.id and c.name = 'Theme'
      join entity_field_entry ef on e.id = ef.entity_id 
      join category_field cf on ef.category_field_id = cf.id and cf.name = 'name'
      join role_entity er on e.id = er.entity_id; `;
  //logger.info(query);
  return cy.task('queryDb', query);
}

function getNonDAThemes() {
  const query =
    `SELECT ef.value FROM entity e
      join category c on e.category_id = c.id and c.name = 'Theme'
      join entity_field_entry ef on e.id = ef.entity_id 
      join category_field cf on ef.category_field_id = cf.id and cf.name = 'name'
      left join role_entity er on e.id = er.entity_id
      where er.entity_id is null; `;
  //logger.info(query);
  return cy.task('queryDb', query);
}