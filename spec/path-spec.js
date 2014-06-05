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

describe('path.injectParams', function () {
  describe('when a pattern does not have dynamic segments', function () {
    var pattern = 'a/b/c';

    it('returns the pattern', function () {
      expect(path.injectParams(pattern, {})).toEqual(pattern);
    });
  });

  describe('when a pattern has dynamic segments', function () {
    var pattern = 'comments/:id/edit';

    describe('and a param is missing', function () {
      it('throws an Error', function () {
        expect(function () {
          path.injectParams(pattern, {})
        }).toThrow(Error);
      });
    });

    describe('and all params are present', function () {
      it('returns the correct path', function () {
        expect(path.injectParams(pattern, { id: 'abc' })).toEqual('comments/abc/edit');
      });
    });
  });
});

describe('path.extractQuery', function () {
  describe('when the path contains a query string', function () {
    it('returns the parsed query object', function () {
      expect(path.extractQuery('/a/b/c?id=def&show=true')).toEqual({ id: 'def', show: 'true' });
    });
  });

  describe('when the path does not contain a query string', function () {
    it('returns null', function () {
      expect(path.extractQuery('/a/b/c')).toBe(null);
    });
  });
});

describe('path.withoutQuery', function () {
  it('removes the query string', function () {
    expect(path.withoutQuery('/a/b/c?id=def')).toEqual('/a/b/c');
  });
});

describe('path.withQuery', function () {
  it('appends the query string', function () {
    expect(path.withQuery('/a/b/c', { id: 'def' })).toEqual('/a/b/c?id=def');
  });
});

describe('path.normalize', function () {
  it('removes slashes from the beginning of a path', function () {
    expect(path.normalize('//a/b/c')).toEqual('a/b/c');
  });
});
