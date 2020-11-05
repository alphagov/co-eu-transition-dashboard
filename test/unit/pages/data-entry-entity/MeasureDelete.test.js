const { expect, sinon } = require('test/unit/util/chai');
const { paths } = require('config');
const MeasureDelete = require('pages/data-entry-entity/measure-delete/MeasureDelete');
const authentication = require('services/authentication');
const entityUserPermissions = require('middleware/entityUserPermissions');
const flash = require('middleware/flash');
const measures = require('helpers/measures')
const CategoryField = require('models/categoryField');
const Entity = require('models/entity');
const EntityFieldEntry = require('models/entityFieldEntry');
const sequelize = require('services/sequelize');

let page = {};
let res = {};
let req = {};

describe('pages/data-entry-entity/measure-delete/MeasureDelete', () => {
  beforeEach(() => {

    res = { cookies: sinon.stub(), redirect: sinon.stub(), render: sinon.stub(),   sendStatus: sinon.stub(), send: sinon.stub(), status: sinon.stub(), locals: {} };
    req = { body: {}, cookies: [], params: { groupId: 'measure-1', metricId: 'measure-1', date: '12/10/2020' }, user: { roles: [], getPermittedMetricMap: sinon.stub().returns({}) }, flash: sinon.stub() };
    res.status.returns(res);

    page = new MeasureDelete('measure-delete', req, res);

    sinon.stub(authentication, 'protect').returns([]);
    sinon.stub(entityUserPermissions, 'assignEntityIdsUserCanAccessToLocals');
  });

  afterEach(() => {
    authentication.protect.restore();
    entityUserPermissions.assignEntityIdsUserCanAccessToLocals.restore();
  });

  describe('#url', () => {
    it('returns correct url', () => {
      expect(page.url).to.eql(paths.dataEntryEntity.measureDelete);
    });
  });

  describe('#successfulMode', () => {
    it('returns true when in successful mode', () => {
      page.req.params = { metricId: '123', groupId: '123', successful: "successful" };
      expect(page.successfulMode).to.be.ok;
    });

    it('returns false when not in successful mode', () => {
      expect(page.successfulMode).to.be.not.ok;
    });
  });

  describe('#backUrl', () => {
    it('returns edit page url when not successful mode', () => {
      page.req.params = { metricId: '123', groupId: '456' };
      expect(page.backUrl).to.eql(`${paths.dataEntryEntity.measureEdit}/123/456`)
    });

    it('returns list page when  in successful mode', () => {
      page.req.params = { metricId: '123', groupId: '456', successful: "successful"  };
      expect(page.backUrl).to.eql(`${paths.dataEntryEntity.measureList}`)
    });
  });

  describe('#middleware', () => {
    it('only uploaders are allowed to access this page', () => {
      expect(page.middleware).to.eql([
        ...authentication.protect(['uploader']),
        flash
      ]);

      sinon.assert.calledWith(authentication.protect, ['uploader']);
    });
  });

  describe('#postRequest', () => {
    beforeEach(() => {
      sinon.stub(page, 'deleteMeasure')
    });

    afterEach(() => {
      page.deleteMeasure.restore();
    });

    it('should call deleteMeasure and redirect to sucessful url', async () => {
      req.originalUrl = 'someurl';
      await page.postRequest(req, res);

      sinon.assert.calledOnce(page.deleteMeasure);
      sinon.assert.calledWith(res.redirect, `${req.originalUrl}/successful`);
    });

    it('should call deleteMeasure and redirect back to delete page when an error occurs', async () => {
      req.originalUrl = 'someurl';

      page.deleteMeasure.throws('error')

      await page.postRequest(req, res);

      sinon.assert.calledOnce(page.deleteMeasure);
      sinon.assert.calledWith(req.flash, ["An error occoured when deleting the measure."]);
      sinon.assert.calledWith(res.redirect, req.originalUrl);
    });
  });

  describe('#deleteMeasure', () => {
    const entities = [{ id: 123 }];
    const raygEntities = [{ id: 1 }]
    const measureEntities = {
      measureEntities: entities,
      raygEntities,
      uniqMetricIds: ['metric1']
    };

    const transaction = sequelize.transaction();

    beforeEach(() => {
      sinon.stub(page, 'getMeasure').returns(measureEntities);
      sinon.stub(Entity, 'delete');
      transaction.commit.reset();
      transaction.rollback.reset();

    });

    afterEach(() => {
      page.getMeasure.restore();
      Entity.delete.restore();
    });

    it('should call Entity.delete for all measureEntities and raygEntities when measure is not in a group', async () => {
      await page.deleteMeasure();

      sinon.assert.calledWith(Entity.delete, entities[0].id, { transaction });
      sinon.assert.calledWith(Entity.delete, raygEntities[0].id, { transaction });
      sinon.assert.calledTwice(Entity.delete);
      sinon.assert.calledOnce(transaction.commit);
    });

    it('should only call Entity.delete for all measureEntities and not raygEntities when measure is part in a group', async () => {
      const measureEntities = {
        measureEntities: [{ id: 123 }],
        raygEntities: [{ id: 1 }],
        uniqMetricIds: ['metric1', 'metric1']
      };
      page.getMeasure.returns(measureEntities);

      await page.deleteMeasure();

      sinon.assert.calledOnce(Entity.delete);
      sinon.assert.calledOnce(transaction.commit);
    });

    it('should  call transaction.rollback when an error occurs during delete', async () => {
      page.getMeasure.returns(measureEntities);
      Entity.delete.throws(new Error('error'));

      let message = '';
      try{
        await page.deleteMeasure();
      } catch (error) {
        message = error.message;
      }

      expect(message).to.eql('error');
      sinon.assert.notCalled(transaction.commit);
      sinon.assert.calledOnce(transaction.rollback);
    });
  });

  describe('#getGroupEntities', () => {
    const entities = {
      id: 'some-id',
      publicId: 'some-public-id-1',
      parents: [
        {
          publicId: 'parent-1',
          categoryId: 1,
        }
      ]
    };
    const category = { id: 2 };
    const entityFieldEntries = [{ value: 'new value', categoryField: { name: 'test' } }];

    beforeEach(() => {
      sinon.stub(measures, 'getEntityFields').returns(entityFieldEntries)
      Entity.findAll.returns([entities]);
    });

    afterEach(() => {
      measures.getEntityFields.restore();
    });

    it('gets entities for a given category if admin', async () => {
      const response = await page.getGroupEntities(category);

      expect(response).to.eql({ 
        groupEntities: [{
          id: 'some-id',
          publicId: 'some-public-id-1',
          test: 'new value',
        }],
        raygEntities: []
      });

      sinon.assert.calledWith(Entity.findAll, {
        where: { categoryId: category.id },
        include: [{
          model: EntityFieldEntry,
          where: { value: req.params.groupId },
          include: {
            model: CategoryField,
            where: { name: 'groupId' },
          }
        }]
      });
    });
  });

  describe('#getMeasure', () => {
    const measureCategory = { id: 'some-category' };
    const measureEntities = {
      groupEntities : [{ metricID: 'measure-1', id: 'new-id', publicId: 'pubId', parents: [], entityFieldEntries: [{ categoryField: { name: 'test' }, value: 'new value' }] }],
      raygEntities: [{ publicId: 'rayg1', filter: 'RAYG' }]
    };

    beforeEach(() => {
      sinon.stub(measures, 'getCategory').returns(measureCategory);
      sinon.stub(page, 'getGroupEntities').returns({ groupEntities: [], raygEntities: [] });
    });

    afterEach(() => {
      measures.getCategory.restore();
      page.getGroupEntities.restore();
    });

    it('Get measures data', async () => {
      page.getGroupEntities.returns(measureEntities);

      const response = await page.getMeasure();

      sinon.assert.calledOnce(measures.getCategory);
      sinon.assert.calledOnce(page.getGroupEntities);

      expect(response).to.eql({
        measureEntities: measureEntities.groupEntities,
        raygEntities: measureEntities.raygEntities,
        uniqMetricIds: ['measure-1']
      });
    });

    it('redirects to list if no entity data', async () => {
      await page.getMeasure();

      sinon.assert.calledOnce(measures.getCategory);
      sinon.assert.calledOnce(page.getGroupEntities);
      sinon.assert.calledWith(res.redirect, paths.dataEntryEntity.measureList);
    });
  });

  describe('#getMeasureData', () => {
    const measureEntities = {
      measureEntities: [{ metricID: 'metric1' }],
      raygEntities: [{ value: 1 }],
      uniqMetricIds: ['metric1']
    };

    beforeEach(() => {
      sinon.stub(page, 'getMeasure').returns(measureEntities);
    });

    afterEach(() => {
      page.getMeasure.restore();
    });

    it('getMeasureData should call getMeasure', async () => {
      await page.getMeasureData();
      sinon.assert.calledOnce(page.getMeasure);
    });
  });
});