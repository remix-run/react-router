import expect from 'expect';
import { getPathname, getQueryString, getParamNames, getParams, formatPattern } from '../URLUtils';

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

describe('getParamNames', function () {
  describe('when a pattern contains no dynamic segments', function () {
    it('returns an empty array', function () {
      expect(getParamNames('a/b/c')).toEqual([]);
    });
  });

  describe('when a pattern contains :a and :b dynamic segments', function () {
    it('returns the correct names', function () {
      expect(getParamNames('/comments/:a/:b/edit')).toEqual([ 'a', 'b' ]);
    });
  });

  describe('when a pattern has a *', function () {
    it('uses the name "splat"', function () {
      expect(getParamNames('/files/*.jpg')).toEqual([ 'splat' ]);
    });
  });
});

describe('getParams', function () {
  describe('when a pattern does not have dynamic segments', function () {
    var pattern = 'a/b/c';

    describe('and the path matches', function () {
      it('returns an empty object', function () {
        expect(getParams(pattern, pattern)).toEqual({});
      });
    });

    describe('and the path does not match', function () {
      it('returns null', function () {
        expect(getParams(pattern, 'd/e/f')).toBe(null);
      });
    });
  });

  describe('when a pattern has dynamic segments', function () {
    var pattern = 'comments/:id.:ext/edit';

    describe('and the path matches', function () {
      it('returns an object with the params', function () {
        expect(getParams(pattern, 'comments/abc.js/edit')).toEqual({ id: 'abc', ext: 'js' });
      });
    });

    describe('and the pattern is optional', function () {
      var pattern = 'comments/(:id)/edit';

      describe('and the path matches with supplied param', function () {
        it('returns an object with the params', function () {
          expect(getParams(pattern, 'comments/123/edit')).toEqual({ id: '123' });
        });
      });

      describe('and the path matches without supplied param', function () {
        it('returns an object with an undefined param', function () {
          expect(getParams(pattern, 'comments//edit')).toEqual({ id: undefined });
        });
      });
    });

    describe('and the pattern and forward slash are optional', function () {
      var pattern = 'comments(/:id)/edit';

      describe('and the path matches with supplied param', function () {
        it('returns an object with the params', function () {
          expect(getParams(pattern, 'comments/123/edit')).toEqual({ id: '123' });
        });
      });

      describe('and the path matches without supplied param', function () {
        it('returns an object with an undefined param', function () {
          expect(getParams(pattern, 'comments/edit')).toEqual({ id: undefined });
        });
      });
    });

    describe('and the path does not match', function () {
      it('returns null', function () {
        expect(getParams(pattern, 'users/123')).toBe(null);
      });
    });

    describe('and the path matches with a segment containing a .', function () {
      it('returns an object with the params', function () {
        expect(getParams(pattern, 'comments/foo.bar/edit')).toEqual({ id: 'foo', ext: 'bar' });
      });
    });
  });

  describe('when a pattern has characters that have special URL encoding', function () {
    var pattern = 'one, two';

    describe('and the path matches', function () {
      it('returns an empty object', function () {
        expect(getParams(pattern, 'one, two')).toEqual({});
      });
    });

    describe('and the path does not match', function () {
      it('returns null', function () {
        expect(getParams(pattern, 'one two')).toBe(null);
      });
    });
  });

  describe('when a pattern has dynamic segments and characters that have special URL encoding', function () {
    var pattern = '/comments/:id/edit now';

    describe('and the path matches', function () {
      it('returns an object with the params', function () {
        expect(getParams(pattern, '/comments/abc/edit now')).toEqual({ id: 'abc' });
      });
    });

    describe('and the path does not match', function () {
      it('returns null', function () {
        expect(getParams(pattern, '/users/123')).toBe(null);
      });
    });
  });

  describe('when a pattern has a *', function () {
    describe('and the path matches', function () {
      it('returns an object with the params', function () {
        expect(getParams('/files/*', '/files/my/photo.jpg')).toEqual({ splat: 'my/photo.jpg' });
        expect(getParams('/files/*', '/files/my/photo.jpg.zip')).toEqual({ splat: 'my/photo.jpg.zip' });
        expect(getParams('/files/*.jpg', '/files/my/photo.jpg')).toEqual({ splat: 'my/photo' });
        expect(getParams('/files/*.jpg', '/files/my/new\nline.jpg')).toEqual({ splat: 'my/new\nline' });
      });
    });

    describe('and the path does not match', function () {
      it('returns null', function () {
        expect(getParams('/files/*.jpg', '/files/my/photo.png')).toBe(null);
      });
    });
  });

  describe('when a pattern has an optional group', function () {
    var pattern = '/archive(/:name)';

    describe('and the path matches', function () {
      it('returns an object with the params', function () {
        expect(getParams(pattern, '/archive/foo')).toEqual({ name: 'foo' });
        expect(getParams(pattern, '/archive')).toEqual({ name: undefined });
      });
    });

    describe('and the path does not match', function () {
      it('returns null', function () {
        expect(getParams(pattern, '/archiv')).toBe(null);
      });
    });
  });

  describe('when a param has dots', function () {
    var pattern = '/:query/with/:domain';

    describe('and the path matches', function () {
      it('returns an object with the params', function () {
        expect(getParams(pattern, '/foo/with/foo.app')).toEqual({ query: 'foo', domain: 'foo.app' });
        expect(getParams(pattern, '/foo.ap/with/foo')).toEqual({ query: 'foo.ap', domain: 'foo' });
        expect(getParams(pattern, '/foo.ap/with/foo.app')).toEqual({ query: 'foo.ap', domain: 'foo.app' });
      });
    });

    describe('and the path does not match', function () {
      it('returns null', function () {
        expect(getParams(pattern, '/foo.ap')).toBe(null);
      });
    });
  });
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
        expect(formatPattern(pattern, { id: 'one, two' })).toEqual('comments/one%2C%20two/edit');
      });
    });

    describe('and a param has a forward slash', function () {
      it('preserves the forward slash', function () {
        expect(formatPattern(pattern, { id: 'the/id' })).toEqual('comments/the%2Fid/edit');
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
