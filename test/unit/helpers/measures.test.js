const { expect, sinon } = require('test/unit/util/chai');
const Category = require('models/category');
const EntityFieldEntry = require('models/entityFieldEntry');
const measures = require('helpers/measures');
const parse = require('helpers/parse');
const validation = require('helpers/validation');
const Entity = require('models/entity');
const CategoryField = require('models/categoryField');
const transitionReadinessData = require('helpers/transitionReadinessData');
const { paths } = require('config');
const moment = require('moment');

describe('helpers/measures', () => {
  describe('#applyLabelToEntities', () => {
    it('Should create label with filtervalue and filtervalue2 when both filter and filter2 exist', async () => {
      const measureEntities = [{ filter: 'filter1', filterValue: 'value1', filter2: 'filter2', filterValue2: 'value2' }];
      measures.applyLabelToEntities(measureEntities);
      expect(measureEntities[0].label).to.eql('filter1 : value1');
      expect(measureEntities[0].label2).to.eql('filter2 : value2');
    });

    it('Should create label with filtervalue if only filter exists', async () => {
      const measureEntities = [{ filter: 'filter1', filterValue: 'value1' }];
      measures.applyLabelToEntities(measureEntities);
      expect(measureEntities[0].label).to.eql('filter1 : value1');
    });

    it('Should not create label when there are no filters', async () => {
      const measureEntities = [{ other: 'other values', }];
      measures.applyLabelToEntities(measureEntities);
      expect(measureEntities[0].label).not.to.exist;
    });
  });

  describe('#calculateUiInputs', () => {
    it('should filter list of entities by date and return data for unique entities when filter and filter2 are set', async () => {
      const measureEntities = [
        { metricID: 'metric1', date: '05/10/2020', filter: 'country', filterValue: 'england', filter2: 'area', filterValue2: 'north', value: 10 },
        { metricID: 'metric1', date: '05/10/2020', filter: 'country', filterValue: 'england', filter2: 'area', filterValue2: 'north', value: 5 },
      ];

      const response = await measures.calculateUiInputs(measureEntities);
      expect(response).to.eql([measureEntities[0]]);
    });

    it('should filter list of entities by date and return data for unique entities when only filter is set', async () => {
      const measureEntities = [
        { metricID: 'metric1', date: '05/10/2020', filter: 'country', filterValue: 'england', value: 100 },
        { metricID: 'metric1', date: '05/10/2020', filter: 'country', filterValue: 'england', value: 50 },
      ];
      const response = await measures.calculateUiInputs(measureEntities);
      expect(response).to.eql([measureEntities[0]]);
    });

    it('should filter list of entities by date and return data for unique entities when neither filter or filter2 is set', async () => {
      const measureEntities = [
        { metricID: 'metric1', date: '05/10/2020', value: 20 },
        { metricID: 'metric1', date: '05/10/2020', value: 10 },
      ];
      const response = await measures.calculateUiInputs(measureEntities);
      expect(response).to.eql([measureEntities[0]]);
    });
  });

  describe('#getEntityFields', () => {
    it('gets entity fields', async () => {
      const entityFieldEntries = [{ entityfieldEntry: { value: 'new value', categoryField: { name: 'test' } } }];
      EntityFieldEntry.findAll.resolves(entityFieldEntries);

      const response = await measures.getEntityFields('measure-1');

      expect(response).to.eql(entityFieldEntries);
    });

    it('returns error when no entity fields data ', async () => {
      EntityFieldEntry.findAll.resolves();

      let error = {};
      try {
        await measures.getEntityFields('measure-1');
      } catch (err) {
        error = err.message;
      }

      expect(error).to.eql('EntityFieldEntry export, error finding entityFieldEntries');
    });
  });

  describe('#getCategory', () => {
    it('gets and returns a single category', async () => {
      const category = { name: 'Theme' };
      Category.findAll.resolves(category);

      const response = await measures.getCategory('Theme');

      expect(response).to.eql(category);
    });

    it('gets and returns mutiple categories', async () => {
      const category = [{ name: 'Theme' }, { name: 'Measure' }];
      Category.findAll.resolves(category);

      const response = await measures.getCategory('Theme', 'Measure');

      expect(response).to.eql(category);
    });

    it('throws error when it cannot find category', async () => {
      Category.findAll.resolves();

      let error = {};
      try {
        await measures.getCategory();
      } catch (err) {
        error = err.message;
      }

      expect(error).to.eql('Category export, error finding Measure category');
    });
  });

  describe('#getMeasureEntitiesFromGroup', () => {

    it('should return filter data which only contains the same metric, sorted by date', async () => {
      const measure1 = { name: 'test1', metricID: 'measure-1', date: '05/10/2020' }
      const measure2 = { name: 'test2', metricID: 'measure-2', date: '05/10/2020' }
      const measure3 = { name: 'test3', metricID: 'measure-1', date: '04/10/2020' }
      const groupEntities = [measure1, measure2, measure3];
      const response =  measures.getMeasureEntitiesFromGroup(groupEntities, 'measure-1');

      expect(response).to.eql([ measure3, measure1 ]);
    });
  });

  describe('#validateFormData', () => {
    beforeEach(() => {
      sinon.stub(measures, 'calculateUiInputs').returns([{ id: 123 }, { id: 456 }]);
    });

    afterEach(() => {
      measures.calculateUiInputs.restore();
    });

    it('should return an error when date is not valid', async () => {
      const formData = { day: '10', month: '14', year: '2020', entities:{} };

      const response = await measures.validateFormData(formData);
      expect(response[0]).to.eql("Invalid date");
    });

    it('should return an error when date already exists', async () => {
      const formData = { day: '05', month: '10', year: '2020', entities:{} };
      const measuresEntities = [{ metricID: 'metric1', date: '05/10/2020', value: 2 }];

      const response = await measures.validateFormData(formData, measuresEntities);
      expect(response[0]).to.eql("Date already exists");
    });

    it('should return an error when no entities data is present', async () => {
      const formData = { day: '10', month: '12', year: '2020' };
      const response = await measures.validateFormData(formData);
      expect(response[0]).to.eql("Missing entity values");
    });

    it('should return an error when entities data is empty', async () => {
      const formData = { day: '10', month: '12', year: '2020', entities: {} };
      const response = await measures.validateFormData(formData);
      expect(response[0]).to.eql("You must submit at least one value");
    });

    it('should return an error when entities data is empty', async () => {
      const formData = { day: '10', month: '12', year: '2020', entities:{ 123: '', 456: 10 } };
      const response = await measures.validateFormData(formData);
      expect(response[0]).to.eql("Invalid field value");
    });

    it('should return an error when entities data is NaN', async () => {
      const formData = { day: '10', month: '12', year: '2020', entities:{ 123: 'hello', 456: 10 } };
      const response = await measures.validateFormData(formData);
      expect(response[0]).to.eql("Invalid field value");
    });

    it('should return an empty array when data is valid', async () => {
      const formData = { day: '10', month: '12', year: '2020', entities:{ 123: 5, 456: 10 } };
      const response = await measures.validateFormData(formData);
      expect(response.length).to.eql(0);
    });
  });


  describe('#validateEntities', () => {
    const categoryFields = [{ id: 1 }];

    beforeEach(() => {
      sinon.stub(Category, 'fieldDefinitions').returns(categoryFields);
      sinon.stub(validation, 'validateItems');
      sinon.stub(parse, 'parseItems')
    });

    afterEach(() => {
      parse.parseItems.restore();
      validation.validateItems.restore();
      Category.fieldDefinitions.restore();
    });

    it('rejects if no entities found', async () => {
      parse.parseItems.returns([]);
      validation.validateItems.returns([])
      const response = await measures.validateEntities();
      expect(response.errors).to.eql([{ error: 'No entities found' }]);
    });

    it('validates each item parsed', async () => {
      const items = [{ id: 1 }, { id: 2 }];
      const parsedItems = [{ foo: 'bar' }];
      parse.parseItems.returns(parsedItems);
      validation.validateItems.returns([])

      const response = await measures.validateEntities(items);

      expect(response).to.eql({ errors: [], parsedEntities: [ { foo: 'bar' } ] });
      sinon.assert.calledWith(validation.validateItems, parsedItems, categoryFields);
    });
  });

  describe('#getMeasureEntities', () => {
    const entities = [{
      id: 'some-id',
      publicId: 'some-public-id-1',
      entityFieldEntries: [{
        categoryField: { name: 'name' },
        value: 'some name'
      }],
      parents: [{
        parents: [{
          categoryId: 1,
          entityFieldEntries: [{
            categoryField: { name: 'name' },
            value: 'theme name'
          }]
        }]
      }],
      created_at: '2020-09-05T13:15:30Z',
      updated_at: '2020-09-06T13:15:30Z',
      updateDueOn: "2020-11-20T13:15:30Z"
    },{
      id: 'some-id',
      publicId: 'some-public-id-2',
      entityFieldEntries: [{
        categoryField: { name: 'name' },
        value: 'some name'
      },{
        categoryField: { name: 'filter' },
        value: 'RAYG'
      }],
      parents: [{
        parents: [{
          categoryId: 1,
          entityFieldEntries: [{
            categoryField: { name: 'name' },
            value: 'theme name'
          }]
        }]
      }],
      created_at: '2020-10-05T13:15:30Z',
      updated_at: '2020-11-05T13:15:30Z',
      updateDueOn: "2020-11-20T13:15:30Z"
    }];
    const category = { id: 1 };

    beforeEach(() => {
      Entity.findAll = sinon.stub().returns(entities);
    });

    it('gets entities for a given category if admin', async () => {
      const user = { roles:[{ name: 'admin' }], isAdmin: true };

      const response = await measures.getMeasureEntities({
        measureCategory:category,
        themeCategory:category,
        user
      });
      expect(response).to.eql([{
        id: "some-id",
        name: "some name",
        publicId: "some-public-id-1",
        theme: "theme name",
        createdAt: '2020-09-05T13:15:30Z',
        updatedAt: '2020-09-06T13:15:30Z',
        updateDueOn: "2020-11-20T13:15:30Z"
      },{
        filter: "RAYG",
        id: "some-id",
        name: "some name",
        publicId: "some-public-id-2",
        theme: "theme name",
        createdAt: '2020-10-05T13:15:30Z',
        updatedAt: '2020-11-05T13:15:30Z',
        updateDueOn: "2020-11-20T13:15:30Z"
      }]);

      sinon.assert.calledWith(Entity.findAll, {
        where: { categoryId: category.id },
        include: [{
          separate: true,
          model: EntityFieldEntry,
          include: CategoryField
        },{
          model: Entity,
          as: 'parents',
          include: [{
            model: Category
          }, {
            model: Entity,
            as: 'parents',
            include: [{
              separate: true,
              model: EntityFieldEntry,
              include: CategoryField
            }, {
              model: Category
            }]
          }]
        }]
      });
    });
  });

  describe('#groupMeasures', () => {
    const msrs = [{
      id: "some-id",
      name: "some name",
      publicId: "some-public-id-1",
      theme: "theme name",
      groupID: 'Group 1',
      metricID: 'm1',
      redThreshold: 1,
      aYThreshold: 2,
      greenThreshold: 3,
      value: 1,
      updatedAt: '2020-11-05T13:15:30Z',
      updateDueOn: "20/11/2020"
    },{
      filter: "RAYG",
      id: "some-id",
      name: "some name",
      publicId: "some-public-id-2",
      theme: "theme name",
      groupID: 'Group 1',
      metricID: 'm1',
      redThreshold: 1,
      aYThreshold: 2,
      greenThreshold: 3,
      value: 1,
      updatedAt: '2020-11-06T13:15:30Z',
      updateDueOn: "20/11/2020"
    }];

    it('groups measures by rayg row, sets rayg colour', () => {
      const measureGroups = measures.groupMeasures(msrs);
      expect(measureGroups).to.eql([{
        aYThreshold: 2,
        colour: "red",
        filter: 'RAYG',
        id: 'some-id',
        name: 'some name',
        publicId: 'some-public-id-2',
        theme: 'theme name',
        groupID: 'Group 1',
        metricID: 'm1',
        redThreshold: 1,
        greenThreshold: 3,
        value: 1,
        updatedAt: '05/11/2020',
        updateDueOn: '20/11/2020',
        children: [
          {
            id: 'some-id',
            name: 'some name',
            publicId: 'some-public-id-1',
            theme: 'theme name',
            groupID: 'Group 1',
            metricID: 'm1',
            redThreshold: 1,
            aYThreshold: 2,
            greenThreshold: 3,
            value: 1,
            updatedAt: moment('2020-11-05T13:15:30Z'),
            updatedAtDate: '05/11/2020',
            colour: 'red',
            updateDueOn: '20/11/2020'
          }
        ], 
      }]);
    })
  });

  describe('#getMeasuresWhichUserHasAccess', () => {
    const allThemes = [
      {
        id: 884,
        publicId: 'B',
        categoryId: 1,
        children: [{
          id: 700,
          publicId: 'st-01',
          categoryId: 2,
          children: [{
            id: 701,
            publicId: 'st-01-01',
            categoryId: 2,
            children: [{
              id: 600,
              publicId: 'm01',
              categoryId: 3,
              name: 'measure1',
            }]
          }]
        }]
      }, {
        id: 885,
        publicId: 'B1',
        categoryId: 1,
        children: [{
          id: 702,
          publicId: 'st1-01',
          categoryId: 2,
          children: [{
            id: 601,
            publicId: 'm02',
            categoryId: 3,
            name: 'measure2',
          },{
            id: 602,
            publicId: 'm03',
            categoryId: 3,
            name: 'measure3',
          }]
        }]
      }
    ]
    const entitiesUserCanAccess = [{ entity: { dataValues: { publicId: 'm01', id: 600, children: [] } } },
      { entity: { dataValues: { publicId: 'm02', id: 601, children: [] } } },
      { entity: { dataValues: { publicId: 'm03', id: 602, children: [] } } }]

    const measuresPublicId = ['m01', 'm02', 'm03'];
    const measuresWithLink = [{
      id: 600,
      publicId: 'm01',
      name: 'measure1',
      color: 'green',
      found: true,
      theme: 'Borders',
      link: '/transition-readiness-detail/B/st-01/measure1',
      tags: [{
        name: 'some-tag'
      }]
    }, {
      id: 601,
      publicId: 'm02',
      name: 'measure2',
      color: 'green',
      found: true,
      theme: 'Borders',
      link: '/transition-readiness-detail/B/st1-01/measure2'
    },{
      id: 602,
      publicId: 'm03',
      name: 'measure3',
      color: 'green',
      found: true,
      theme: 'Borders',
      link: '/transition-readiness-detail/B/st1-01/measure3'
    }]
    let measuresWithLinkStub ;
    let getThemesHierarchyStub;
    const measureCategory = [{ id: 3 }, { id: 4 }];


    beforeEach(() => {
      Category.findAll.resolves(measureCategory);
      measuresWithLinkStub = sinon.stub(transitionReadinessData, 'measuresWithLink');
      getThemesHierarchyStub = sinon.stub(transitionReadinessData, 'getThemesHierarchy');
    });

    afterEach(() => {
      transitionReadinessData.measuresWithLink.restore();
    });


    it('returns only those measures which user has access', async ()=>{
      measuresWithLinkStub.resolves(measuresWithLink);
      getThemesHierarchyStub.resolves(allThemes);

      const expectedMeasures = {
        tags: [ 'some-tag' ],
        measures: measuresWithLink,
        themes: allThemes,
        colors: [{ color: 'red', definition: 'High risk' }, { color: 'amber', definition: 'Medium risk' }, { color: 'yellow', definition: 'Low risk' }, { color: 'green', definition: 'Minimal/No risk' }]
      }

      const measuresWhichUserHasAccess = await measures.getMeasuresWhichUserHasAccess(entitiesUserCanAccess);


      expect(measuresWhichUserHasAccess).to.eql(expectedMeasures);
      sinon.assert.calledWith(getThemesHierarchyStub, entitiesUserCanAccess);
      sinon.assert.calledWith(measuresWithLinkStub, allThemes, measuresPublicId, paths.transitionReadinessThemeDetail);
    });
  });

  describe('#getMaxUpdateAtForMeasures', ()=> {
    it('should return max updated at date for measures', () => {
      const mockMeasures = [{ updatedAt: '2020-11-05T13:15:30Z' }, { updatedAt: '2020-11-06T13:15:30Z' }]
      const exectedMaxMeasureUpdatedAt = moment('2020-11-06T13:15:30Z')
      const maxMeasureUpdatedAt = measures.getMaxUpdateAtForMeasures(mockMeasures);
      expect(exectedMaxMeasureUpdatedAt).to.eql(maxMeasureUpdatedAt);
    })

    it('should return createdAt as max updated at date for measures when updatedAt is not set', () => {
      const mockMeasures = [{ createdAt: '2020-11-05T13:15:30Z' }, { createdAt: '2020-11-06T13:15:30Z' }]
      const exectedMaxMeasureUpdatedAt = moment('2020-11-06T13:15:30Z')
      const maxMeasureUpdatedAt = measures.getMaxUpdateAtForMeasures(mockMeasures);
      expect(exectedMaxMeasureUpdatedAt).to.eql(maxMeasureUpdatedAt);
    })
  })

  describe('#isMeasurePastUpdateDue', ()=>{
    it('should return due when updateDueOn lesser than today', ()=>{
      const measure = { updateDueOn: moment().subtract(1, 'd').format("DD/MM/YYYY") };

      const isDue = measures.isMeasurePastUpdateDue(measure);

      expect(isDue).to.eql('due');
    });

    it('should return notDue when updateDueOn undefined', ()=>{
      const measure = { updateDueOn: undefined };

      const isDue = measures.isMeasurePastUpdateDue(measure);

      expect(isDue).to.eql('notDue');
    });

    it('should return notDue when updateDueOn is in future', ()=>{
      const measure = { updateDueOn: moment().add(1, 'd').format("DD/MM/YYYY") }

      const isDue = measures.isMeasurePastUpdateDue(measure);

      expect(isDue).to.eql('notDue');
    });
  })
});
