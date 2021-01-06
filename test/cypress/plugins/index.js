/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************
const mysql = require('mysql2')
const dbconfig = require('config')

module.exports = (on) => {
  const env = dbconfig.services.mysql;
  // Usage: cy.task('queryDb', query)
  on('task', {
    queryDb: query => {
      return queryTestDb(query, env)
    },
  })
}

function queryTestDb(query, env) {
  // creates a new mysql connection using credentials from cypress.json env's
  const connection = mysql.createConnection(
    {
      "uri": env.uri,
      "sslCertificate": env.sslCertificate,
      "charset": env.charset,
      "multipleStatements": true
    });
  // start connection to db
  connection.connect();
  // exec query + disconnect to db as a Promise
  return new Promise((resolve, reject) => {
    connection.query(query, (error, results) => {
      if (error) reject(error)
      else {
        connection.end()
        // console.log(results)
        return resolve(results)
      }
    })
  })
}



