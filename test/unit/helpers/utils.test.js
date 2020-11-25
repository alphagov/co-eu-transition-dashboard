const utils = require('helpers/utils');
const { expect } = require('test/unit/util/chai');

describe('helpers/utils', () => {
  describe('#removeNulls', () => {
    it('should remove empty items from arrays', () => {
      const test = [1,'',undefined,[1, '', undefined],0,'0'];
      expect(utils.removeNulls(test)).to.eql([1,[1],0,'0']);
    });

    it('should remove empty items from objects', () => {
      const test = { a: 'a', b: undefined, c: null, d: '', e: { a: 1, b: '' }, f: 0, g:['0'] };
      expect(utils.removeNulls(test)).to.eql({ a: 'a', e: { a: 1 }, f: 0, g:['0'] });
    });

    it('should remove empty items from object/array and keep number type in array as is', () => {
      const test = { a: { b: '', c: '' }, d: ['0', '', 1] };
      expect(utils.removeNulls(test)).to.eql({ d: ['0', 1] });
    });

    it('should remove empty items from mixed types', () => {
      const test = [
        {
          a: 'a',
          b: undefined,
          c: null,
          d: '',
          e: ['a', ''],
          f: 0
        }, {
          a: undefined,
          b: [1,'', undefined]
        }
      ];

      expect(utils.removeNulls(test)).to.eql([{ a: 'a', e: ['a'], f: 0 }, { b: [1] }]);
    });
  });
});