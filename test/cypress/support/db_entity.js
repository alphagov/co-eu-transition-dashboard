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

Cypress.Commands.add('getTagList', () => {
  getTagList().as('dbResultTagList');
});

Cypress.Commands.add('getTagedMeasure', (tagname) => {
  getTagedMeasure(tagname).as('dbResultMeasurelist');
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

function getTagList() {
  const query =
    `SELECT name FROM tag;`;
  return cy.task('queryDb', query);
}

function getTagedMeasure(tagname) {
  const query =
    `SELECT distinct id, name from (
      (SELECT efe.entity_id as entity_id, efe.value as id FROM tag_entity te
      join tag t on t.id = te.tag_id
      join entity e on e.id = te.entity_id
      join entity_field_entry efe on e.id = efe.entity_id
      join category_field cf on cf.id = efe.category_field_id
      where cf.name = 'metricID' 
      and t.name = '${tagname}') a,
      (SELECT efe.entity_id as entity_id, efe.value as name FROM tag_entity te
      join tag t on t.id = te.tag_id
      join entity e on e.id = te.entity_id
      join entity_field_entry efe on e.id = efe.entity_id
      join category_field cf on cf.id = efe.category_field_id
      where cf.name = 'name' 
      and t.name = '${tagname}') b ) where a.entity_id = b.entity_id
      order by id;`;
  return cy.task('queryDb', query);
}