import matchPath from "../matchPath";

describe("matchPath", () => {
  describe('with path="/"', () => {
    it('returns correct url at "/"', () => {
      const path = "/";
      const pathname = "/";
      const match = matchPath(pathname, path);
      expect(match.url).toBe("/");
    });

    it('returns correct url at "/somewhere/else"', () => {
      const path = "/";
      const pathname = "/somewhere/else";
      const match = matchPath(pathname, path);
      expect(match.url).toBe("/");
    });
  });

  describe('with path="/somewhere"', () => {
    it('returns correct url at "/somewhere"', () => {
      const path = "/somewhere";
      const pathname = "/somewhere";
      const match = matchPath(pathname, path);
      expect(match.url).toBe("/somewhere");
    });

    it('returns correct url at "/somewhere/else"', () => {
      const path = "/somewhere";
      const pathname = "/somewhere/else";
      const match = matchPath(pathname, path);
      expect(match.url).toBe("/somewhere");
    });
  });

  describe("with sensitive path", () => {
    it("returns non-sensitive url", () => {
      const options = {
        path: "/SomeWhere"
      };
      const pathname = "/somewhere";
      const match = matchPath(pathname, options);
      expect(match.url).toBe("/somewhere");
    });

    it("returns sensitive url", () => {
      const options = {
        path: "/SomeWhere",
        sensitive: true
      };
      const pathname = "/somewhere";
      const match = matchPath(pathname, options);
      expect(match).toBe(null);
    });
  });

  describe("with no path", () => {
    it("returns parent match", () => {
      const parentMatch = {
        url: "/test-location/7",
        path: "/test-location/:number",
        params: { number: 7 },
        isExact: true
      };
      const match = matchPath("/test-location/7", {}, parentMatch);
      expect(match).toBe(parentMatch);
    });

    it("returns null when parent match is null", () => {
      const pathname = "/some/path";
      const match = matchPath(pathname, {}, null);
      expect(match).toBe(null);
    });
  });

  describe("cache", () => {
    it("creates a cache entry for each exact/strict pair", () => {
      // true/false and false/true will collide when adding booleans
      const trueFalse = matchPath(
        '/one/two',
        { path: '/one/two/', exact : true, strict: false }
      )
      const falseTrue = matchPath(
        '/one/two',
        { path: '/one/two/', exact : false, strict: true }
      )
      expect(!!trueFalse).toBe(true)
      expect(!!falseTrue).toBe(false)
    })
  })

  describe('parentMatch', () => {
    describe('absolute path', () => {   
      it('does not merge parent params', () => {
        const parentMatch = {
          url: '/state/GA',
          path: '/state/:abbr',
          params: { abbr: 'GA' },
          isExact: true
        }
        const match = matchPath(
          '/state/GA',
          { path: '/state/GA' },
          parentMatch
        )

        expect(match.params.abbr).toBe(undefined)
      })

    })

    describe('relative path', () => {
      it('resolves using parentMatch.url before matching', () => {
        const parentMatch = {
          url: '/state',
          path: '/state',
          params: {},
          isExact: false
        }
        const match = matchPath(
          '/state/WI',
          { path: 'WI' },
          parentMatch
        )
        expect(match).toNotBe(null)
        expect(match.url).toBe('/state/WI')
      })

      it('merges parentMatch.params into match.params', () => {
        const parentMatch = {
          url: '/state/CO',
          path: '/state/:state',
          params: { state: 'CO' },
          isExact: false
        }
        const match = matchPath(
          '/state/CO/Denver',
          { path: ':city' },
          parentMatch
        )
        
        expect(match.params).toIncludeKeys(['state', 'city'])
      })

      it('works when parentMatch.url has trailing slash', () => {
        const parentMatch = {
          url: '/state/',
          path: '/state/',
          params: {},
          isExact: false
        }
        const match = matchPath(
          '/state/OR',
          { path: ':state' },
          parentMatch
        )
        
        expect(match.url).toBe('/state/OR')
        expect(match.path).toBe('/state/:state')
      })

      it('matches using parentMatch.url when path is empty string', () => {
        const parentMatch = {
          url: '/state',
          path: '/state',
          params: {},
          isExact: false
        }
        const match = matchPath(
          '/state/WA',
          { path: '' },
          parentMatch
        )
        
        expect(match.url).toBe('/state')
        expect(match.path).toBe('/state')
      })

      it('resolves using root when parentMatch is null', () => {
        const match = matchPath(
          '/state/CA',
          { path: 'state/:state' },
          null
        )
        
        expect(match.url).toBe('/state/CA')
        expect(match.path).toBe('/state/:state')
      })
    })

    describe('undefined path', () => {
      it('inherits parent\'s match.url and path', () => {
        const parentMatch = {
          url: '/state',
          path: '/state',
          params: {},
          isExact: false
        }
        const match = matchPath(
          '/state/OR',
          {},
          parentMatch
        )

        expect(match.url).toBe('/state')
        expect(match.path).toBe('/state')
      })

      it('sets url to / when there is no parent match', () => {
        const match = matchPath(
          '/state/OR',
          {},
          null
        )

        expect(match.url).toBe('/')
        expect(match.path).toBe(undefined)
      })
    })
  })
})
