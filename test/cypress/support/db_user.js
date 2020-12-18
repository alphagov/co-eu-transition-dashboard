//const logger = require('middleware/logger');

Cypress.Commands.add('createuser', (username) => {
  cy.fixture('login').then((data) => {
    createuser(username, data.hashed_passphrase, data.secret).as('dbResultUserID');
  });
});

Cypress.Commands.add('deleteuser', (username) => {
  deleteuser(username).as('dbResultUserID');
});

Cypress.Commands.add('addrole', (username, rolename) => {
  addrole(username, rolename).as('dbResultUserID');
});

Cypress.Commands.add('deleterole', (username, rolename) => {
  deleterole(username, rolename).as('dbResultUserID');
});

Cypress.Commands.add('addDepartment', (username, departmentname) => {
  addDepartment(username, departmentname).as('dbResultUserID');
});

Cypress.Commands.add('getAlldepartment', () => {
  getAlldepartment().as('dbResultAllDepartment');
});

Cypress.Commands.add('addAllDepartment', (username) => {
  cy.getAlldepartment().as('dbResultAllDepartment');
  cy.get('@dbResultAllDepartment').then((res) => {
    res.forEach(departmentname => {
      addDepartment(username, departmentname.name).as('dbResultUserID');
    });
  });
});

Cypress.Commands.add('deletedepartment', (username, departmentname) => {
  deletedepartment(username, departmentname).as('dbResultUserID');
});

function createuser(username, hashed_passphrase, secret) {
  const query =
    `set @email = '${username}'  COLLATE utf8mb4_0900_ai_ci;
      INSERT INTO user (\`email\`, \`last_login_at\`, \`hashed_passphrase\`, \`role\`, \`login_attempts\`, \`must_change_password\`) 
      VALUES (@email, '2020-11-27 12:12:59', '${hashed_passphrase}', 'admin', '0', '0'); 
      select id into @l_userid from user where email = @email; 
      UPDATE user SET \`twofa_secret\` = '${secret}' WHERE (\`id\` = @l_userid);`;
  //logger.info(query);
  return cy.task('queryDb', query);
}

function addrole(username, rolename) {
  const query =
    `set @email = '${username}'  COLLATE utf8mb4_0900_ai_ci;
        select id into @l_userid from user where email = @email; 
        select id into @l_roleid from role where name='${rolename}';
        INSERT INTO user_role (\`user_id\`, \`role_id\`) VALUES (@l_userid, @l_roleid);`;
  //logger.info(query);
  return cy.task('queryDb', query);
}

function deleterole(username,rolename) {
  const query =
    `set @email = '${username}'  COLLATE utf8mb4_0900_ai_ci;
          select id into @l_userid from user where email = @email; 
          select id into @l_roleid from role where name='${rolename}';
          DELETE FROM user_role where user_id = @l_userid and role_id =@l_roleid; `;
  //logger.info(query);
  return cy.task('queryDb', query);
}

function deleteuser(username) {
  const query =
    `set @email = '${username}' COLLATE utf8mb4_0900_ai_ci;
        select id into @l_userid from user where email = @email;
        DELETE FROM bulk_import where user_id = @l_userid; 
        DELETE FROM user_role where user_id = @l_userid;
        DELETE FROM department_user where user_id = @l_userid;
        DELETE FROM user where id = @l_userid;`;
  //logger.info(query);
  return cy.task('queryDb', query);
}

function addDepartment(username, departmentname) {
  const query =
    `set @email = '${username}'  COLLATE utf8mb4_0900_ai_ci;
      select id into @l_userid from user where email = @email; 
      INSERT INTO department_user (\`department_name\`, \`user_id\`) VALUES ('${departmentname}', @l_userid); `;
  //logger.info(query);
  return cy.task('queryDb', query);
}

function deletedepartment(username, departmentname) {
  const query =
    `set @email = '${username}'  COLLATE utf8mb4_0900_ai_ci;
      select id into @l_userid from user where email = @email; 
      DELETE FROM department_user where department_name = '${departmentname}' and user_id = @l_userid ); `;
  //logger.info(query);
  return cy.task('queryDb', query);
}

function getAlldepartment() {
  const query =
    `SELECT name FROM dashboard.department; `;
  return cy.task('queryDb', query);
}