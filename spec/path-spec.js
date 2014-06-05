require('./helper');
var path = require('../lib/path');

describe('path.extractParams', function () {
  describe('when a pattern does not have dynamic segments', function () {
    var pattern = 'a/b/c';

    describe('and the path matches', function () {
      it('returns an empty object', function () {
        expect(path.extractParams(pattern, pattern)).toEqual({});
      });
    });

    describe('and the path does not match', function () {
      it('returns null', function () {
        expect(path.extractParams(pattern, 'd/e/f')).toBe(null);
      });
    });
  });

  describe('when a pattern has dynamic segments', function () {
    var pattern = 'comments/:id/edit';

    describe('and the path matches', function () {
      it('returns an object with the params', function () {
        expect(path.extractParams(pattern, 'comments/abc/edit')).toEqual({ id: 'abc' });
      });
    });

    describe('and the path does not match', function () {
      it('returns null', function () {
        expect(path.extractParams(pattern, 'users/123')).toBe(null);
      });
    });
  });
});
