Cypress.Commands.add('createuser', () => {
  cy.fixture('login').then((data) => {
    createuser(data.username,data.hashed_passphrase,data.secret).as('dbResultUserID');
  });
  });

  function createuser(username,hashed_passphrase,secret) {
    const query =
      `set @email = '${username}';
      INSERT INTO dashboard.user (\`email\`, \`last_login_at\`, \`hashed_passphrase\`, \`role\`, \`login_attempts\`, \`must_change_password\`) 
      VALUES (@email, '2020-11-27 12:12:59', '${hashed_passphrase}', 'admin', '0', '0'); 
      select id into @l_userid from dashboard.user where email = @email; 
      INSERT INTO dashboard.user_role (\`user_id\`, \`role_id\`) VALUES (@l_userid, '1'); 
      INSERT INTO dashboard.user_role (\`user_id\`, \`role_id\`) VALUES (@l_userid, '9');
      INSERT INTO dashboard.user_role (\`user_id\`, \`role_id\`) VALUES (@l_userid, '8');
      INSERT INTO dashboard.department_user (\`department_name\`, \`user_id\`) VALUES ('BEIS', @l_userid);
      UPDATE dashboard.user SET \`twofa_secret\` = '${secret}' WHERE (\`id\` = @l_userid); `;
      cy.log(query);
    return cy.task('queryDb', query);
  }