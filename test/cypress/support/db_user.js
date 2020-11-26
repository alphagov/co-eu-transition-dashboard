Cypress.Commands.add('getRandomUser', (userrole) => {
    getRandomUser(userrole).as('dbResultUserID');
  });

  function getRandomUser(userrole) {
    const query =
      `SELECT user_id FROM dashboard.user_role where role_id = 1 LIMIT 1;`;
    return cy.task('queryDb', query);
  }