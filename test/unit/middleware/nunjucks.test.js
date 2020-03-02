const { sinon } = require('test/unit/util/chai');
const path = require('path');
const proxyquire = require('proxyquire');

const expressNunjucksStub = sinon.stub().returns({});
const nunjucksAwaitFilterStub = sinon.stub();
const nunjucks = proxyquire('middleware/nunjucks', {
  'express-nunjucks': expressNunjucksStub,
  'nunjucks-await-filter': nunjucksAwaitFilterStub
});

const viewsToInclude = [
  path.join(__dirname, '../../..', 'node_modules', 'govuk-frontend'),
  path.join(__dirname, '../../..', 'common', 'views'),
  path.join(__dirname, '../../..', 'common', 'views'),
  path.join(__dirname, '../../..', 'pages')
];

let app = {};

describe('middleware/nunjucks', () => {
  describe('#attach', () => {
    before(() => {
      app.set = sinon.stub();

      nunjucks.attach(app);
    });

    it('adds correct views', () => {
      sinon.assert.calledWith(app.set, 'views', viewsToInclude);
    });

    it('executes espress nunjucks', () => {
      sinon.assert.calledOnce(expressNunjucksStub);
    });

    it('executes await filter', () => {
      sinon.assert.calledOnce(nunjucksAwaitFilterStub);
    });
  });
});