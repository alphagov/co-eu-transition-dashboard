const { expect } = require('test/unit/util/chai');
const { paths } = require('config');

let page = {};
let res = {};
let req = {};

describe('pages/accessibility/Accessibility', () => {
  beforeEach(() => {
    const PrivacyNotice = require('pages/accessibility/Accessibility');

    page = new PrivacyNotice('some path', req, res);
  });

  describe('#url', () => {
    it('returns correct url', () => {
      expect(page.url).to.eql(paths.accessibility);
    });
  });

  describe('#middleware', () => {
    it('only static users are allowed to access this page', () => {
      expect(page.middleware).to.eql([]);
    });
  });
});
