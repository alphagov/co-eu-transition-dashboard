const { expect, sinon } = require('test/unit/util/chai');
const Project = require('models/project');
const Milestone = require('models/milestone');
const modelUtils = require('helpers/models');
const ProjectFieldEntry = require('models/projectFieldEntry');
const ProjectField = require('models/projectField');

describe('models/project', () => {
  beforeEach(() => {
    sinon.stub(modelUtils, 'createFilterOptions');
    ProjectField.findAll = sinon.stub().returns([]);
  });

  afterEach(() => {
    modelUtils.createFilterOptions.restore();
  });

  it('called Project.hasMany with the correct parameters', () => {
    expect(Project.hasMany).to.have.been.calledWith(Milestone, { foreignKey: 'projectUid' });
    expect(Project.hasMany).to.have.been.calledWith(ProjectFieldEntry, { foreignKey: 'projectUid' });
    expect(Project.hasMany).to.have.been.calledWith(ProjectFieldEntry, { foreignKey: 'projectUid', as: 'ProjectFieldEntryFilter' });
    expect(Project.hasMany).to.have.been.calledWith(Project, { as: 'projects_count', foreignKey: 'uid' });
  });

  it('called ProjectFieldEntry.belongsTo with the correct parameters', () => {
    expect(ProjectFieldEntry.belongsTo).to.have.been.calledWith(Project, { foreignKey: 'projectUid' });
  });

  it('returns true if attribute exsists in class', () => {
    expect(Project.includes('uid')).to.be.ok;
  });

  it('#createSearch', () => {
    const key = 'test 123';
    const options = { options: 1 };
    Project.createSearch(key, options);
    sinon.assert.calledWith(modelUtils.createFilterOptions, key, options);
  });

  it('#fields', () => {
    const key = 'test 123';
    const options = { options: 1 };
    Project.createSearch(key, options);
    sinon.assert.calledWith(modelUtils.createFilterOptions, key, options);
  });

  it('#fieldDefintions', async () => {
    const definitions = await Project.fieldDefintions();

    expect(definitions).to.eql([
      {
        name: 'uid',
        type: 'string',
        isRequired: true,
        isUnique: true,
        importColumnName: 'UID'
      },{
        name: 'departmentName',
        type: 'group',
        isRequired: true,
        importColumnName: 'Dept',
        config: { options: [] }
      },{
        name: 'title',
        type: 'string',
        importColumnName: 'Project Title'
      },{
        name: 'sro',
        type: 'string',
        importColumnName: 'Project SRO + email address'
      },{
        name: 'description',
        type: 'string',
        importColumnName: 'Project Description'
      },{
        name: 'impact',
        type: 'integer',
        config: {
          options: [0,1,2,3]
        },
        importColumnName: 'Impact Rating'
      }
    ])

    sinon.assert.calledWith(ProjectField.findAll, { where: { is_active: true } });
  });

  describe('#import', () => {
    beforeEach(() => {
      sinon.stub(Project, 'importProjectFieldEntries').resolves();
    });

    afterEach(() => {
      Project.importProjectFieldEntries.restore();
    });

    it('only calls upsert with core fields', async () => {
      const project = { uid: 1, departmentName: 'name', customField: 'custom field' };
      const options = { someoption: 1 };
      const projectFields = [];

      await Project.import(project, projectFields, options);

      sinon.assert.calledWith(Project.upsert, { departmentName: 'name', uid: 1 }, options);
      sinon.assert.calledWith(Project.importProjectFieldEntries, project, projectFields, options);
    });
  });

  describe('#importProjectFieldEntries', () => {
    beforeEach(() => {
      sinon.stub(ProjectFieldEntry, 'import').resolves();
    });

    afterEach(() => {
      ProjectFieldEntry.import.restore();
    });

    it('only imports field entries and not project attributes', async () => {
      const project = { uid: 1, fieldEntry1: 'field entry 1', fieldEntry2: 'field entry 2' };
      const options = { someoption: 1 };
      const projectFields = [{ name: 'fieldEntry1', id: 15 }, { name: 'fieldEntry2', id: 16 }];

      await Project.importProjectFieldEntries(project, projectFields, options);

      sinon.assert.calledWith(ProjectFieldEntry.import, { projectUid: 1, fieldId: 15, value: 'field entry 1' }, options);
      sinon.assert.calledWith(ProjectFieldEntry.import, { projectUid: 1, fieldId: 16, value: 'field entry 2' }, options);
    });
  });

  describe('#fields', () => {
    const field = new Map();
    field.set('field1', {
      value: 'value 1'
    });
    field.set('field2', {
      value: 'value 2'
    });

    const sampleFields = [];
    sampleFields.push( { fields: field } );

    let instance = {};

    beforeEach(() => {
      instance = new Project();
      instance.get = sinon.stub().returns(sampleFields);

      sinon.stub(modelUtils, 'transformForView').returns(new Map());
    });

    afterEach(() => {
      modelUtils.transformForView.restore();
    });

    it('returns main attributes as well as fields', () => {
      const fields = instance.fields;
      expect(fields.get('field1').value).to.eql('value 1');
      expect(fields.get('field2').value).to.eql('value 2');
    });
  });
});
