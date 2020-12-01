const { expect } = require('test/unit/util/chai');
const { STRING, INTEGER } = require('sequelize');
const Tag = require('models/tag');

describe('models/tag', () => {
  it('called Tag.init with the correct parameters', () => {
    expect(Tag.init).to.have.been.calledWith({
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: STRING(45),
        allowNull: true,
        unique: true
      }
    });
  });
});
