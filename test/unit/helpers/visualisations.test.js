const { expect, sinon } = require('test/unit/util/chai');
const VizualisationHelper = require('helpers/visualisation');
const Entity = require('models/entity');
const Category = require('models/category');
const Visualisation = require('models/visualisation');
const EntityFieldEntry = require('models/entityFieldEntry');
const CategoryField = require('models/categoryField');
const readinessHelper = require('helpers/transitionReadinessData');

let visualisationHelper;
const entityId = 123;
let req = { user: {} };

describe('helpers/vizualisationHelper', () => {
  beforeEach(async () => {
    Entity.findOne.resolves({
      entityFieldEntries: [{
        categoryField: {
          name: 'name'
        },
        value: 'Some name'
      }],
      category: {
        name: 'Measure'
      },
      id: 123
    });
    visualisationHelper = new VizualisationHelper(entityId, req);
  });

  afterEach(() => {

  });

  describe('#constructEntityVisualisations', () => {
    it('should throw an error if entityId is not passed to function', async () => {
      try{
        new VizualisationHelper(entityId, req);
      } catch(err) {
        expect(err.message).to.equal('entityId must be included in function call');
      }
    });

    it('should call findOne with all the correct params and includes', async () => {
      new VizualisationHelper(entityId, req);

      sinon.assert.calledWith(Entity.findOne, {
        include: [{
          model: Visualisation,
        },
        {
          model: Category,
        },
        {
          attributes: ['id'],
          model: Entity,
          as: 'parents'
        },
        {
          seperate: true,
          model: EntityFieldEntry,
          include: {
            attributes: ['name'],
            model: CategoryField,
            where: { isActive: true }
          }
        }],
        where: { id: entityId }
      });
    });
  });

  describe('#getCategoryVisualisation', () => {
    it('should throw an error if category is not passed to function', async () => {
      try{
        await visualisationHelper.getCategoryVisualisation();
      } catch(err) {
        expect(err.message).to.equal('category must be included in function call');
      }
    });

    it('should call getVisualisations when function is called', async () => {
      const category = { getVisualisations: sinon.stub() }
      await visualisationHelper.getCategoryVisualisation(category);
      sinon.assert.calledOnce(category.getVisualisations);
    });
  });

  describe('#formatVisualisationData', () => {
    it('Should return correctly formatted data when categoryVisualisation is set in the data', async () => {
      const categoryVisualisationData = [{ name: 'bob', template: 'measure', categoryVisualisation: { config: { test: {} } } }]
      const response = await visualisationHelper.formatVisualisationData(categoryVisualisationData);
      expect(response).to.eql([{ name: 'bob', template: 'measure', config: { test: {} }, priority: null }]); 
    });

    it('Should return correctly formatted data when entityVisualisation is set in the data', async () => {
      const entityVisualisationData = [{ name: 'dave', template: 'communications', entityVisualisation: { config: { test: {} }, priority: 1 } }]
      const response = await visualisationHelper.formatVisualisationData(entityVisualisationData);
      expect(response).to.eql([{ name: 'dave', template: 'communications', config: { test: {} }, priority: 1 }]); 
    });
  });

  describe('#getVisualisations', () => {
    it('should call getIframeUrl when entity is measure and ', async () => {
      Entity.findOne.resolves({
        entityFieldEntries: [{
          categoryField: {
            name: 'name'
          },
          value: 'Some name'
        }],
        category: {
          name: 'Measure'
        },
        id: 123,
        visualisations: [{}]
      });

      const visualisationHelper = new VizualisationHelper(entityId, req);

      var formatVisualisationDataSpy = sinon.spy(visualisationHelper, 'formatVisualisationData');
      var getIframeUrlSpy = sinon.spy(readinessHelper, 'getIframeUrl');
     
      const response = await visualisationHelper.getVisualisations(entityId, req);

      sinon.assert.calledOnce(formatVisualisationDataSpy);
      sinon.assert.calledOnce(getIframeUrlSpy);
      expect(response).to.have.property('iframeUrl');
    });

    it('should call getCategoryVisualisation when entity visualisations are empty', async () => {
      Entity.findOne.resolves({
        entityFieldEntries: [{
          categoryField: {
            name: 'name'
          },
          value: 'Some name'
        }],
        category: {
          name: 'Measure',
          getVisualisations: sinon.stub().returns([{}])
        },
        id: 123,
        visualisations: []
      });

      const visualisationHelper = new VizualisationHelper(entityId, req);

      var formatVisualisationDataSpy = sinon.spy(visualisationHelper, 'formatVisualisationData');
      var getCategoryVisualisationSpy = sinon.spy(visualisationHelper, 'getCategoryVisualisation');
     
      await visualisationHelper.getVisualisations(entityId, req);

      sinon.assert.calledOnce(formatVisualisationDataSpy);
      sinon.assert.calledOnce(getCategoryVisualisationSpy);
    });
  });

  describe('#Project and Milestones', () => {
    it('should call mapProjectFields', async () => {
      const project = { departmentName: 'DIT', title: 'title', projectFieldEntries: [] };
      const response = await visualisationHelper.mapProjectFields(project);
      expect(response).to.eql({ departmentName: 'DIT', title: 'title', name: 'DIT - title', projectFieldEntries: [] });
    });

    it('should call mapMilestoneFields', async () => {
      const project = { hmgConfidence: 0 };
      const milestone = { description: 'desc', milestoneFieldEntries: [] };
      const response = await visualisationHelper.mapMilestoneFields(milestone, project);
      expect(response).to.eql({ name: 'desc', description: 'desc', hmgConfidence: 0, milestoneFieldEntries: [] });
    });
  });

  describe('#getParentEntity', () => {
    const entity =  { 
      public_id: 1
    }; 

    beforeEach(()=>{
      Entity.findOne.returns(entity);
    });

    it('returns parent entity ID', async ()=>{
      const response = await visualisationHelper.getParentEntity(1);

      sinon.assert.calledWith(Entity.findOne, {
        where: {
          id: 1
        }
      });

      expect(response).to.deep.equal({ public_id: 1 })
    })
  })
});
