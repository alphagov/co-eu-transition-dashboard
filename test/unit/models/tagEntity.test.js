const { expect } = require('test/unit/util/chai');
const { INTEGER } = require('sequelize');
const TagEntity = require('models/tagEntity');

describe('models/tagEntity', () => {
  it('called TagEntity.init with the correct parameters', () => {
    expect(TagEntity.init).to.have.been.calledWith({
      entityId: {
        type: INTEGER,
        field: "entity_id",
      },
      tagId: {
        type: INTEGER,
        field: "tag_id",
      }
    });
  });
});
