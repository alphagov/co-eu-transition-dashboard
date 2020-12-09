Cypress.Commands.add('createuser', (username) => {
  cy.fixture('login').then((data) => {
    createuser(username,data.hashed_passphrase,data.secret).as('dbResultUserID');
  });
  });

  Cypress.Commands.add('deleteuser', (username) => {
    deleteuser(username).as('dbResultUserID');
  });

  Cypress.Commands.add('addrole', (username,rolename) => {
    addrole(username,rolename).as('dbResultUserID');
  });

  Cypress.Commands.add('deleterole', (username,rolename) => {
    deleterole(username,rolename).as('dbResultUserID');
  });

  Cypress.Commands.add('addDepartment', (username,departmentname) => {
    addDepartment(username, departmentname).as('dbResultUserID');
  });

  Cypress.Commands.add('deletedepartment', (username,departmentname) => {
    deletedepartment(username, departmentname).as('dbResultUserID');
  });

  function createuser(username,hashed_passphrase,secret) {
    const query =
      `set @email = '${username}'  COLLATE utf8mb4_0900_ai_ci;
      INSERT INTO dashboard.user (\`email\`, \`last_login_at\`, \`hashed_passphrase\`, \`role\`, \`login_attempts\`, \`must_change_password\`) 
      VALUES (@email, '2020-11-27 12:12:59', '${hashed_passphrase}', 'admin', '0', '0'); 
      select id into @l_userid from dashboard.user where email = @email; 
      UPDATE dashboard.user SET \`twofa_secret\` = '${secret}' WHERE (\`id\` = @l_userid);`;
      cy.log(query);
    return cy.task('queryDb', query);
  };

    function addrole(username, rolename) {
      const query =
        `set @email = '${username}'  COLLATE utf8mb4_0900_ai_ci;
        select id into @l_userid from dashboard.user where email = @email; 
        select id into @l_roleid from dashboard.role where name='${rolename}';
        INSERT INTO dashboard.user_role (\`user_id\`, \`role_id\`) VALUES (@l_userid, @l_roleid);`;
        cy.log(query);
      return cy.task('queryDb', query);
    };

      function deleterole(username) {
        const query =
          `set @email = '${username}'  COLLATE utf8mb4_0900_ai_ci;
          select id into @l_userid from dashboard.user where email = @email; 
          select id into @l_roleid from dashboard.role where name='${rolename}';
          DELETE FROM dashboard.user_role where user_id = @l_userid and role_id =@l_roleid; `;
          cy.log(query);
        return cy.task('queryDb', query);
      };

    function deleteuser(username) {
      const query =
        `set @email = '${username}' COLLATE utf8mb4_0900_ai_ci;
        select id into @l_userid from dashboard.user where email = @email;
        DELETE FROM dashboard.bulk_import where user_id = @l_userid; 
        DELETE FROM dashboard.user_role where user_id = @l_userid;
        DELETE FROM dashboard.department_user where user_id = @l_userid;
        DELETE FROM dashboard.user where id = @l_userid;`;
        cy.log(query);
      return cy.task('queryDb', query);
  };

  function addDepartment(username, departmentname) {
    const query =
      `set @email = '${username}'  COLLATE utf8mb4_0900_ai_ci;
      select id into @l_userid from dashboard.user where email = @email; 
      INSERT INTO dashboard.department_user (\`department_name\`, \`user_id\`) VALUES ('${departmentname}', @l_userid); `;
      cy.log(query);
    return cy.task('queryDb', query);
  };

  function deletedepartment(username, departmentname) {
    const query =
      `set @email = '${username}'  COLLATE utf8mb4_0900_ai_ci;
      select id into @l_userid from dashboard.user where email = @email; 
      DELETE FROM dashboard.department_user where department_name = '${departmentname}' and user_id = @l_userid ); `;
      cy.log(query);
    return cy.task('queryDb', query);
  };