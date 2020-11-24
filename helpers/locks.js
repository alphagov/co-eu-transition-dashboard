const sequelize = require('services/sequelize');
const { v4: uuidv4 } = require('uuid');

const setLock = async (name) => {
  const guid = uuidv4();
  const query = `UPDATE dashboard_locks SET guid=? WHERE name=? AND guid IS NULL`;
  const options = {
    replacements: [ guid, name ]
  };
  await sequelize.query(query, options);
  return guid;
};

const getLock = async (guid, name) => {
  const query = `SELECT * FROM dashboard_locks WHERE guid=? AND name=?`;
  const options = {
    replacements: [ guid, name ]
  };
  const response = await sequelize.query(query, options);
  return response[0].length > 0;
};

const clearLock = async (name) => {
  const query = `UPDATE dashboard_locks SET guid=NULL WHERE name=?`;
  const options = {
    replacements: [ name ]
  };
  await sequelize.query(query, options);
};

module.exports = {
  setLock,
  getLock,
  clearLock
};
