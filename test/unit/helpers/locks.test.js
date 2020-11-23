const { expect, sinon } = require('test/unit/util/chai');
const locks = require('helpers/locks');
const sequelize = require('services/sequelize');

describe('helpers/locks', () => {
  const name = 'test';
  describe('#setLock', () => {
    it('should set lock with a uuid', async () => {
      const guid = await locks.setLock(name);
      const options = {
        replacements: [ guid, name ]
      };
      sinon.assert.calledWith(sequelize.query, `UPDATE dashboard_locks SET guid=? WHERE name=? AND guid IS NULL`, options)
    })
  });

  describe('#getLock', () => {
    it('should return false if guid does not match', async () => {
      const guid = 'some guid';
      sequelize.query.resolves([[], []]);

      const response = await locks.getLock(guid, name);

      expect(response).to.not.be.ok;
    });

    it('should return true if guid does match', async () => {
      const guid = 'some guid';
      sequelize.query.resolves([[{}], [{}]]);

      const response = await locks.getLock(guid, name);

      expect(response).to.be.ok;

      const options = {
        replacements: [ guid, name ]
      };
      sinon.assert.calledWith(sequelize.query, 'SELECT * FROM dashboard_locks WHERE guid=? AND name=?', options)
    });
  });

  describe('#clearLock', () => {
    it('should clear the lock', async () => {
      await locks.clearLock(name);
      const options = {
        replacements: [ name ]
      };
      sinon.assert.calledWith(sequelize.query, `UPDATE dashboard_locks SET guid=NULL WHERE name=?`, options)
    });
  });
});
