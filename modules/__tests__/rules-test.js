import expect from 'expect'
import { matchPattern } from '../PatternUtils'
import * as rules from '../rules'

describe('custom Rules', function () {

  function assertMatch({ pattern, params }, pathname, remainingPathname, paramNames, paramValues) {
    const match = matchPattern(pattern, pathname, params)
    expect(match.remainingPathname).toEqual(remainingPathname)
    expect(match.paramNames).toEqual(paramNames)
    expect(match.paramValues).toEqual(paramValues)
  }

  describe('when there is no param rule', function () {
    const pattern = '/users/:userId'

    it('should treat the parameter as string', function () {
      assertMatch({ pattern }, '/users/xyz', '', [ 'userId' ], [ 'xyz' ])
    })

  })

  describe('int rule', function () {
    const pathDef = {
      pattern: '/friends/:userId',
      params: { userId: rules.int() }
    }

    it('should not validate non-integers', function () {
      assertMatch(pathDef, '/friends/xyz')
    })

    it('should convert the parameter to integer', function () {
      assertMatch(pathDef, '/friends/1234', '', [ 'userId' ], [ 1234 ])
      expect(Number.isInteger(matchPattern(pathDef.pattern, '/friends/1234')
        .paramValues[0])).toBeTrue
    })

    describe('when the `max` argument is set', function () {
      const pathDef = {
        pattern: '/enemies/:userId',
        params: { userId: rules.int({ max: 100 }) }
      }

      it('should validate only values lower than max', function () {
        assertMatch(pathDef, '/enemies/200')
        assertMatch(pathDef, '/enemies/88', '', [ 'userId' ], [ 88 ])
      })

    })

    describe('when the `min` argument is set', function () {
      const pathDef = {
        pattern: '/clients/:userId',
        params: { userId: rules.int({ min: 100 }) }
      }

      it('should validate only values higher than max', function () {
        assertMatch(pathDef, '/clients/88')
        assertMatch(pathDef, '/clients/200', '', [ 'userId' ], [ 200 ])
      })

    })

    describe('when the `fixedLength` argument is set', function () {
      const pathDef = {
        pattern: '/players/:userId',
        params: { userId: rules.int({ fixedLength: 4 }) }
      }

      it('should validate only values with the specified length', function () {
        assertMatch(pathDef, '/players/883')
        assertMatch(pathDef, '/players/61012')
        assertMatch(pathDef, '/players/2004', '', [ 'userId' ], [ 2004 ])
      })

    })

  })

  describe('string rule', function () {

    describe('when the `maxLength` argument is set', function () {
      const pathDef = {
        pattern: 'searchSmall/:query',
        params: { query: rules.string({ maxLength: 8 }) }
      }

      it('should accept only values shorter than `maxLength`', function () {
        assertMatch(pathDef, '/searchSmall/loooooong')
        assertMatch(pathDef, '/searchSmall/short', '', [ 'query' ], [ 'short' ])
      })
    })

    describe('when the `minLength` argument is set', function () {
      const pathDef = {
        pattern: 'searchLong/:query',
        params: { query: rules.string({ minLength: 8 }) }
      }

      it('should accept only values longer than `minLength`', function () {
        assertMatch(pathDef, '/searchLong/loooooong', '', [ 'query' ], [ 'loooooong' ])
        assertMatch(pathDef, '/searchLong/short')
      })
    })

    describe('when the `length` argument is set', function () {
      const pathDef = {
        pattern: 'search/:query',
        params: { query: rules.string({ length: 6 }) }
      }

      it('should accept only values with the specified length', function () {
        assertMatch(pathDef, '/search/normal', '', [ 'query' ], [ 'normal' ])
        assertMatch(pathDef, '/search/short')
        assertMatch(pathDef, '/search/loooooong')
      })
    })

  })

  describe('greedySplat rule', function () {
    const pathDef = {
      pattern: '/:location/g',
      params: { location: rules.greedySplat() }
    }

    it('should behave like "**"', function () {
      assertMatch(pathDef, '/greedy/is/good/g', '', [ 'location' ], [ 'greedy/is/good' ])
    })

  })

  describe('splat rule', function () {
    const pathDef = {
      pattern: '/:path/:file.jpg',
      params: { path: rules.greedySplat(), file: rules.splat() }
    }

    it('should behave like "*"', function () {
      assertMatch(pathDef, '/files/path/to/file.jpg', '', [ 'path', 'file' ], [ 'files/path/to', 'file' ])
    })

  })

  describe('any rule', function () {
    const pathDef = {
      pattern: 'images/:file.:extension',
      params: { extension: rules.any('jpg', 'png', 'gif') }
    }

    it('should validate only valid options', function () {
      assertMatch(pathDef, 'images/foo.bar')
      assertMatch(pathDef, 'images/foo.jpg', '',[ 'file', 'extension' ], [ 'foo', 'jpg' ])
      assertMatch(pathDef, 'images/bar.png', '',[ 'file', 'extension' ], [ 'bar', 'png' ])
      assertMatch(pathDef, 'images/bar.gif', '',[ 'file', 'extension' ], [ 'bar', 'gif' ])
    })
  })

  describe('UUID rule', function () {
    const pathDef = {
      pattern: 'users/:userUuid',
      params: { userUuid: rules.uuid() }
    }

    it('should validate only valid UUIDs', function () {
      assertMatch(pathDef, 'users/a63ed95a-8061-11e5-8bcf-feff819cdc9f', '', [ 'userUuid' ], [ 'a63ed95a-8061-11e5-8bcf-feff819cdc9f' ])
      assertMatch(pathDef, 'users/a63ed95a-8061-11e5-8bcf-feff819cdc9o')
    })
  })

})
