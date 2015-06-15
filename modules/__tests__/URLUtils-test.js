import expect from 'expect';
import { getPathname, getQueryString, formatPattern } from '../URLUtils';

describe('getPathname', function () {
  it('returns the pathname portion of a path', function () {
    expect(getPathname('/a/b/c?id=def')).toEqual('/a/b/c');
  });
});

describe('getQueryString', function () {
  it('returns the query string portion of a path', function () {
    expect(getQueryString('/a/b/?id=def')).toEqual('id=def');
  });
});

describe('matchPattern', function () {
  it('ignores trailing slashes');
});

describe('formatPattern', function () {
  describe('when a pattern does not have dynamic segments', function () {
    var pattern = 'a/b/c';

    it('returns the pattern', function () {
      expect(formatPattern(pattern, {})).toEqual(pattern);
    });
  });

  describe('when a pattern has dynamic segments', function () {
    var pattern = 'comments/:id/edit';

    describe('and a param is missing', function () {
      it('throws an Error', function () {
        expect(function () {
          formatPattern(pattern, {});
        }).toThrow(Error);
      });
    });

    describe('and a param is optional', function () {
      var pattern = 'comments/(:id)/edit';

      it('returns the correct path when param is supplied', function () {
        expect(formatPattern(pattern, { id:'123' })).toEqual('comments/123/edit');
      });

      it('returns the correct path when param is not supplied', function () {
        expect(formatPattern(pattern, {})).toEqual('comments/edit');
      });
    });

    describe('and a param and forward slash are optional', function () {
      var pattern = 'comments(/:id)/edit';

      it('returns the correct path when param is supplied', function () {
        expect(formatPattern(pattern, { id:'123' })).toEqual('comments/123/edit');
      });

      it('returns the correct path when param is not supplied', function () {
        expect(formatPattern(pattern, {})).toEqual('comments/edit');
      });
    });

    describe('and all params are present', function () {
      it('returns the correct path', function () {
        expect(formatPattern(pattern, { id: 'abc' })).toEqual('comments/abc/edit');
      });

      it('returns the correct path when the value is 0', function () {
        expect(formatPattern(pattern, { id: 0 })).toEqual('comments/0/edit');
      });
    });

    describe('and some params have special URL encoding', function () {
      it('returns the correct path', function () {
        expect(formatPattern(pattern, { id: 'one, two' })).toEqual('comments/one, two/edit');
      });
    });

    describe('and a param has a forward slash', function () {
      it('preserves the forward slash', function () {
        expect(formatPattern(pattern, { id: 'the/id' })).toEqual('comments/the/id/edit');
      });
    });

    describe('and some params contain dots', function () {
      it('returns the correct path', function () {
        expect(formatPattern(pattern, { id: 'alt.black.helicopter' })).toEqual('comments/alt.black.helicopter/edit');
      });
    });
  });

  describe('when a pattern has one splat', function () {
    it('returns the correct path', function () {
      expect(formatPattern('/a/*/d', { splat: 'b/c' })).toEqual('/a/b/c/d');
    });
  });

  describe('when a pattern has multiple splats', function () {
    it('returns the correct path', function () {
      expect(formatPattern('/a/*/c/*', { splat: [ 'b', 'd' ] })).toEqual('/a/b/c/d');
    });

    it('complains if not given enough splat values', function () {
      expect(function () {
        formatPattern('/a/*/c/*', { splat: [ 'b' ] });
      }).toThrow(Error);
    });
  });

  describe('when a pattern has dots', function () {
    it('returns the correct path', function () {
      expect(formatPattern('/foo.bar.baz')).toEqual('/foo.bar.baz');
    });
  });
});
