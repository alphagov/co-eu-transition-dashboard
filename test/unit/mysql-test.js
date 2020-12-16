const { expect, sinon } = require('test/unit/util/chai');
const TestDatabase = require('../helpers/database');
const { QueryTypes } = require('sequelize');

const testDb = new TestDatabase();

const sequelize = require("services/sequelize");

describe('mysql-test', function() {


  beforeEach(async function() {
    await testDb.setup();
  });

  afterEach(async function() {
    await testDb.teardown();
  });

  it('gets a mysql instance', async function() {
    const result = await sequelize.query("SELECT NOW() AS date",{ type: QueryTypes.SELECT });
    expect(result.length).to.eql(1);
    expect(result[0]).to.have.property("date");
  })

  after(async function() {
    await sequelize.close();
  });
});
