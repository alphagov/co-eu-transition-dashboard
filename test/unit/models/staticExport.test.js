const { expect } = require('test/unit/util/chai');
const StaticExport = require('models/staticExport');
const { STRING, ENUM, TEXT, INTEGER } = require('sequelize');

describe('models/staticExport', () => {
  it('called StaticExport.init with the correct parameters', () => {
    expect(StaticExport.init).to.have.been.calledWith({
      id: {
        type: INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      status: ENUM('in_progress', 'complete', 'error', 'queue'),
      url: STRING(2083),
      error: TEXT
    });
  });
});
