var expect = require('expect');
var Path = require('../Path');

describe('Path.extractParamNames', function () {
  describe('when a pattern contains no dynamic segments', function () {
    it('returns an empty array', function () {
      expect(Path.extractParamNames('a/b/c')).toEqual([]);
    });
  });

  describe('when a pattern contains :a and :b dynamic segments', function () {
    it('returns the correct names', function () {
      expect(Path.extractParamNames('/comments/:a/:b/edit')).toEqual([ 'a', 'b' ]);
    });
  });

  describe('when a pattern has a *', function () {
    it('uses the name "splat"', function () {
      expect(Path.extractParamNames('/files/*.jpg')).toEqual([ 'splat' ]);
    });
  });
});

describe('Path.extractParams', function () {
  describe('when a pattern does not have dynamic segments', function () {
    var pattern = 'a/b/c';

    describe('and the path matches', function () {
      it('returns an empty object', function () {
        expect(Path.extractParams(pattern, pattern)).toEqual({});
      });
    });

    describe('and the path does not match', function () {
      it('returns null', function () {
        expect(Path.extractParams(pattern, 'd/e/f')).toBe(null);
      });
    });
  });

  describe('when a pattern has dynamic segments', function () {
    var pattern = 'comments/:id.:ext/edit';

    describe('and the path matches', function () {
      it('returns an object with the params', function () {
        expect(Path.extractParams(pattern, 'comments/abc.js/edit')).toEqual({ id: 'abc', ext: 'js' });
      });
    });

    describe('and the path does not match', function () {
      it('returns null', function () {
        expect(Path.extractParams(pattern, 'users/123')).toBe(null);
      });
    });

    describe('and the path matches with a segment containing a .', function () {
      it('returns an object with the params', function () {
        expect(Path.extractParams(pattern, 'comments/foo.bar/edit')).toEqual({ id: 'foo', ext: 'bar' });
      });
    });
  });

  describe('when a pattern has characters that have special URL encoding', function () {
    var pattern = 'one, two';

    describe('and the path matches', function () {
      it('returns an empty object', function () {
        expect(Path.extractParams(pattern, 'one%2C+two')).toEqual({});
      });
    });

    describe('and the path does not match', function () {
      it('returns null', function () {
        expect(Path.extractParams(pattern, 'one+two')).toBe(null);
      });
    });
  });

  describe('when a pattern has dynamic segments and characters that have special URL encoding', function () {
    var pattern = '/comments/:id/edit now';

    describe('and the path matches', function () {
      it('returns an object with the params', function () {
        expect(Path.extractParams(pattern, '/comments/abc/edit+now')).toEqual({ id: 'abc' });
      });
    });

    describe('and the path does not match', function () {
      it('returns null', function () {
        expect(Path.extractParams(pattern, '/users/123')).toBe(null);
      });
    });
  });

  describe('when a pattern has a *', function () {
    describe('and the path matches', function () {
      it('returns an object with the params', function () {
        expect(Path.extractParams('/files/*', '/files/my/photo.jpg')).toEqual({ splat: 'my/photo.jpg' });
        expect(Path.extractParams('/files/*', '/files/my/photo.jpg.zip')).toEqual({ splat: 'my/photo.jpg.zip' });
        expect(Path.extractParams('/files/*.jpg', '/files/my/photo.jpg')).toEqual({ splat: 'my/photo' });
      });
    });

    describe('and the path does not match', function () {
      it('returns null', function () {
        expect(Path.extractParams('/files/*.jpg', '/files/my/photo.png')).toBe(null);
      });
    });
  });

  describe('when a pattern has a ?', function () {
    var pattern = '/archive/?:name?';

    describe('and the path matches', function () {
      it('returns an object with the params', function () {
        expect(Path.extractParams(pattern, '/archive')).toEqual({ name: undefined });
        expect(Path.extractParams(pattern, '/archive/')).toEqual({ name: undefined });
        expect(Path.extractParams(pattern, '/archive/foo')).toEqual({ name: 'foo' });
        expect(Path.extractParams(pattern, '/archivefoo')).toEqual({ name: 'foo' });
      });
    });

    describe('and the path does not match', function () {
      it('returns null', function () {
        expect(Path.extractParams(pattern, '/archiv')).toBe(null);
      });
    });
  });

  describe('when a param has dots', function () {
    var pattern = '/:query/with/:domain';

    describe('and the path matches', function () {
      it('returns an object with the params', function () {
        expect(Path.extractParams(pattern, '/foo/with/foo.app')).toEqual({ query: 'foo', domain: 'foo.app' });
        expect(Path.extractParams(pattern, '/foo.ap/with/foo')).toEqual({ query: 'foo.ap', domain: 'foo' });
        expect(Path.extractParams(pattern, '/foo.ap/with/foo.app')).toEqual({ query: 'foo.ap', domain: 'foo.app' });
      });
    });

    describe('and the path does not match', function () {
      it('returns null', function () {
        expect(Path.extractParams(pattern, '/foo.ap')).toBe(null);
      });
    });
  });
});

describe('Path.injectParams', function () {
  describe('when a pattern does not have dynamic segments', function () {
    var pattern = 'a/b/c';

    it('returns the pattern', function () {
      expect(Path.injectParams(pattern, {})).toEqual(pattern);
    });
  });

  describe('when a pattern has dynamic segments', function () {
    var pattern = 'comments/:id/edit';

    describe('and a param is missing', function () {
      it('throws an Error', function () {
        expect(function () {
          Path.injectParams(pattern, {})
        }).toThrow(Error);
      });
    });

    describe('and all params are present', function () {
      it('returns the correct path', function () {
        expect(Path.injectParams(pattern, { id: 'abc' })).toEqual('comments/abc/edit');
      });

      it('returns the correct path when the value is 0', function () {
        expect(Path.injectParams(pattern, { id: 0 })).toEqual('comments/0/edit');
      });
    });

    describe('and some params have special URL encoding', function () {
      it('returns the correct path', function () {
        expect(Path.injectParams(pattern, { id: 'one, two' })).toEqual('comments/one%2C+two/edit');
      });
    });

    describe('and a param has a forward slash', function () {
      it('preserves the forward slash', function () {
        expect(Path.injectParams(pattern, { id: 'the/id' })).toEqual('comments/the/id/edit');
      });
    });

    describe('and some params contain dots', function () {
      it('returns the correct path', function () {
        expect(Path.injectParams(pattern, { id: 'alt.black.helicopter' })).toEqual('comments/alt.black.helicopter/edit');
      });
    });
  });

  describe('when a pattern has one splat', function () {
    it('returns the correct path', function () {
      expect(Path.injectParams('/a/*/d', { splat: 'b/c' })).toEqual('/a/b/c/d');
    });
  });

  describe('when a pattern has multiple splats', function () {
    it('returns the correct path', function () {
      expect(Path.injectParams('/a/*/c/*', { splat: [ 'b', 'd' ] })).toEqual('/a/b/c/d');
    });

    it('complains if not given enough splat values', function () {
      expect(function() {
        Path.injectParams('/a/*/c/*', { splat: [ 'b' ] });
      }).toThrow(Error);
    });
  });
});

describe('Path.extractQuery', function () {
  describe('when the path contains a query string', function () {
    it('returns the parsed query object', function () {
      expect(Path.extractQuery('/?id=def&show=true')).toEqual({ id: 'def', show: 'true' });
    });

    it('properly handles arrays', function () {
      expect(Path.extractQuery('/?id%5B%5D=a&id%5B%5D=b')).toEqual({ id: [ 'a', 'b' ] });
    });
  });

  describe('when the path does not contain a query string', function () {
    it('returns null', function () {
      expect(Path.extractQuery('/a/b/c')).toBe(null);
    });
  });
});

describe('Path.withoutQuery', function () {
  it('removes the query string', function () {
    expect(Path.withoutQuery('/a/b/c?id=def')).toEqual('/a/b/c');
  });
});

describe('Path.withQuery', function () {
  it('appends the query string', function () {
    expect(Path.withQuery('/a/b/c', { id: 'def' })).toEqual('/a/b/c?id=def');
  });

  it('merges two query strings', function () {
    expect(Path.withQuery('/path?a=b', { c: [ 'd', 'e' ]})).toEqual('/path?a=b&c%5B0%5D=d&c%5B1%5D=e');
  });
});

describe('Path.normalize', function () {
  describe('on a path with no slashes at the beginning', function () {
    it('adds a slash', function () {
      expect(Path.normalize('a/b/c')).toEqual('/a/b/c');
    });
  });

  describe('on a path with a single slash at the beginning', function () {
    it('preserves the slash', function () {
      expect(Path.normalize('/a/b/c')).toEqual('/a/b/c');
    });
  });

  describe('on a path with many slashes at the beginning', function () {
    it('reduces them to a single slash', function () {
      expect(Path.normalize('//a/b/c')).toEqual('/a/b/c');
    });
  });
});
