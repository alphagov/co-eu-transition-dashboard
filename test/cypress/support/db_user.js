//const logger = require('middleware/logger');
const config = Cypress.config();

Cypress.Commands.add('createuser', () => {
  cy.fixture('login').then((data) => {
    createuser(data.hashed_passphrase, data.secret).as('dbResultUserID');
  });
});

Cypress.Commands.add('deleteuser', () => {
  deleteuser().as('dbResultUserID');
});

Cypress.Commands.add('addroles', (rolename) => {
  deleteAllrole();
  if (rolename == 'All')
  {
    cy.getAllrole().as('dbResultAllrole');
    cy.get('@dbResultAllrole').then((res) => {
      res.forEach(rolename => {
        addrole(rolename).as('dbResultUserID');      
      });
    });
  }
  else
  {
    var rolelist = rolename.split(',');
    cy.log(rolelist);
    rolelist.forEach(rolename => {
      addrole(rolename).as('dbResultUserID');
    });
  }
});

Cypress.Commands.add('deleterole', (rolename) => {
  deleterole(rolename).as('dbResultUserID');
});

Cypress.Commands.add('addDepartments', ( departmentname) => {
  deleteAllDepartment();
  if (departmentname == 'All')
  {
    cy.getAlldepartment().as('dbResultAllDepartment');
    cy.get('@dbResultAllDepartment').then((res) => {
      res.forEach(departmentname => {
        addDepartment(departmentname.name).as('dbResultUserID');
      });
    });
  }
  else
  {
    var deplist = departmentname.split(',');
    cy.log(deplist);
    deplist.forEach(depelement => {
      addDepartment(depelement).as('dbResultUserID');
    });
  }
});

Cypress.Commands.add('getAlldepartment', () => {
  getAlldepartment().as('dbResultAllDepartment');
});

Cypress.Commands.add('getAllrole', () => {
  getAllrole().as('dbResultAllrole');
});
/*Cypress.Commands.add('addAllDepartment', () => {
  cy.getAlldepartment().as('dbResultAllDepartment');
  cy.get('@dbResultAllDepartment').then((res) => {
    res.forEach(departmentname => {
      addDepartment(config.username, departmentname.name).as('dbResultUserID');
    });
  });
});*/

Cypress.Commands.add('deletedepartment', ( departmentname) => {
  deletedepartment(config.username, departmentname).as('dbResultUserID');
});

function createuser(hashed_passphrase, secret) {
  const query =
    `set @email = '${config.username}'  COLLATE utf8mb4_0900_ai_ci;
      INSERT INTO user (\`email\`, \`last_login_at\`, \`hashed_passphrase\`, \`role\`, \`login_attempts\`, \`must_change_password\`) 
      VALUES (@email, '2020-11-27 12:12:59', '${hashed_passphrase}', 'admin', '0', '0'); 
      select id into @l_userid from user where email = @email; 
      UPDATE user SET \`twofa_secret\` = '${secret}' WHERE (\`id\` = @l_userid);`;
  //logger.info(query);
  return cy.task('queryDb', query);
}

function addrole(rolename) {
  const query =
    `set @email = '${config.username}'  COLLATE utf8mb4_0900_ai_ci;
        select id into @l_userid from user where email = @email; 
        select id into @l_roleid from role where name='${rolename}';
        INSERT INTO user_role (\`user_id\`, \`role_id\`) VALUES (@l_userid, @l_roleid);`;
  //logger.info(query);
  return cy.task('queryDb', query);
}

function deleterole(rolename) {
  const query =
    `set @email = '${config.username}'  COLLATE utf8mb4_0900_ai_ci;
          select id into @l_userid from user where email = @email; 
          select id into @l_roleid from role where name='${rolename}';
          DELETE FROM user_role where user_id = @l_userid and role_id =@l_roleid; `;
  //logger.info(query);
  return cy.task('queryDb', query);
}

function deleteAllrole() {
  const query =
    `set @email = '${config.username}'  COLLATE utf8mb4_0900_ai_ci;
      select id into @l_userid from user where email = @email;
      DELETE FROM user_role where user_id = @l_userid; `;
  //logger.info(query);
  return cy.task('queryDb', query);
}

function deleteAllDepartment() {
  const query =
    `set @email = '${config.username}'  COLLATE utf8mb4_0900_ai_ci;
      select id into @l_userid from user where email = @email;
      DELETE FROM department_user where user_id = @l_userid; `;
  //logger.info(query);
  return cy.task('queryDb', query);
}

function deleteuser() {
  const query =
    `set @email = '${config.username}' COLLATE utf8mb4_0900_ai_ci;
        select id into @l_userid from user where email = @email;
        DELETE FROM bulk_import where user_id = @l_userid; 
        DELETE FROM user_role where user_id = @l_userid;
        DELETE FROM department_user where user_id = @l_userid;
        DELETE FROM user where id = @l_userid;`;
  //logger.info(query);
  return cy.task('queryDb', query);
}

function addDepartment(departmentname) {
  const query =
    `set @email = '${config.username}'  COLLATE utf8mb4_0900_ai_ci;
      select id into @l_userid from user where email = @email; 
      INSERT INTO department_user (\`department_name\`, \`user_id\`) VALUES ('${departmentname}', @l_userid); `;
  //logger.info(query);
  return cy.task('queryDb', query);
}

function deletedepartment(departmentname) {
  const query =
    `set @email = '${config.username}'  COLLATE utf8mb4_0900_ai_ci;
      select id into @l_userid from user where email = @email; 
      DELETE FROM department_user where department_name = '${departmentname}' and user_id = @l_userid ); `;
  //logger.info(query);
  return cy.task('queryDb', query);
}

function getAlldepartment() {
  const query =
    `SELECT name FROM department; `;
  return cy.task('queryDb', query);
}

function getAllrole() {
  const query =
    `SELECT name FROM role; `;
  return cy.task('queryDb', query);
}
