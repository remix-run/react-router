var expect = require('expect');
var PathUtils = require('../PathUtils');

describe('PathUtils.injectParams', function () {
  describe('when a pattern does not have dynamic segments', function () {
    var pattern = 'a/b/c';

    it('returns the pattern', function () {
      expect(PathUtils.injectParams(pattern, {})).toEqual(pattern);
    });
  });

  describe('when a pattern has dynamic segments', function () {
    var pattern = 'comments/:id/edit';

    describe('and a param is missing', function () {
      it('throws an Error', function () {
        expect(function () {
          PathUtils.injectParams(pattern, {});
        }).toThrow(Error);
      });
    });

    describe('and a param is optional', function () {
      var pattern = 'comments/(:id)/edit';

      it('returns the correct path when param is supplied', function () {
        expect(PathUtils.injectParams(pattern, { id:'123' })).toEqual('comments/123/edit');
      });

      it('returns the correct path when param is not supplied', function () {
        expect(PathUtils.injectParams(pattern, {})).toEqual('comments/edit');
      });
    });

    describe('and a param and forward slash are optional', function () {
      var pattern = 'comments(/:id)/edit';

      it('returns the correct path when param is supplied', function () {
        expect(PathUtils.injectParams(pattern, { id:'123' })).toEqual('comments/123/edit');
      });

      it('returns the correct path when param is not supplied', function () {
        expect(PathUtils.injectParams(pattern, {})).toEqual('comments/edit');
      });
    });

    describe('and all params are present', function () {
      it('returns the correct path', function () {
        expect(PathUtils.injectParams(pattern, { id: 'abc' })).toEqual('comments/abc/edit');
      });

      it('returns the correct path when the value is 0', function () {
        expect(PathUtils.injectParams(pattern, { id: 0 })).toEqual('comments/0/edit');
      });
    });

    describe('and some params have special URL encoding', function () {
      it('returns the correct path', function () {
        expect(PathUtils.injectParams(pattern, { id: 'one, two' })).toEqual('comments/one, two/edit');
      });
    });

    describe('and a param has a forward slash', function () {
      it('preserves the forward slash', function () {
        expect(PathUtils.injectParams(pattern, { id: 'the/id' })).toEqual('comments/the/id/edit');
      });
    });

    describe('and some params contain dots', function () {
      it('returns the correct path', function () {
        expect(PathUtils.injectParams(pattern, { id: 'alt.black.helicopter' })).toEqual('comments/alt.black.helicopter/edit');
      });
    });
  });

  describe('when a pattern has one splat', function () {
    it('returns the correct path', function () {
      expect(PathUtils.injectParams('/a/*/d', { splat: 'b/c' })).toEqual('/a/b/c/d');
    });
  });

  describe('when a pattern has multiple splats', function () {
    it('returns the correct path', function () {
      expect(PathUtils.injectParams('/a/*/c/*', { splat: [ 'b', 'd' ] })).toEqual('/a/b/c/d');
    });

    it('complains if not given enough splat values', function () {
      expect(function () {
        PathUtils.injectParams('/a/*/c/*', { splat: [ 'b' ] });
      }).toThrow(Error);
    });
  });

  describe('when a pattern has dots', function () {
    it('returns the correct path', function () {
      expect(PathUtils.injectParams('/foo.bar.baz')).toEqual('/foo.bar.baz');
    });
  });
});

describe('PathUtils.getPathname', function () {
  it('returns the path when there is no query', function () {
    expect(PathUtils.getPathname('/a/b/c')).toEqual('/a/b/c');
  });

  it('returns the pathname portion of a path', function () {
    expect(PathUtils.getPathname('/a/b/c?id=def')).toEqual('/a/b/c');
  });
});

describe('PathUtils.getQueryString', function () {
  it('returns an empty string when there is no query', function () {
    expect(PathUtils.getQueryString('/a/b/c')).toEqual('');
  });

  it('returns the querystring portion of a path', function () {
    expect(PathUtils.getQueryString('/a/b/c?id=def')).toEqual('id=def');
  });
});

describe('PathUtils.withQuery', function () {
  it('appends the query string', function () {
    expect(PathUtils.withQuery('/a/b/c', { id: 'def' })).toEqual('/a/b/c?id=def');
  });

  it('handles special characters', function () {
    expect(PathUtils.withQuery('/path', { c: [ 'd#e', 'f&a=i#j+k' ] })).toEqual('/path?c%5B%5D=d%23e&c%5B%5D=f%26a%3Di%23j%2Bk');
  });
});
