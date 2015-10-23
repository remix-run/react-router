import expect from 'expect'
import { matchPattern } from '../PatternUtils'

describe('matchPattern', function () {

  function assertMatch(pattern, pathname, remainingPathname, paramNames, paramValues) {
    expect(matchPattern(pattern, pathname)).toEqual({
      remainingPathname,
      paramNames,
      paramValues
    })
  }
  
  it('works without params', function () {
    assertMatch('/', '/path', 'path', [], [])
  })

  it('works with named params', function () {
    assertMatch('/:id', '/path', '', [ 'id' ], [ 'path' ])
    assertMatch('/:id.:ext', '/path.jpg', '', [ 'id', 'ext' ], [ 'path', 'jpg' ])
  })

  it('works with splat params', function () {
    assertMatch('/files/*.*', '/files/path.jpg', '', [ 'splat', 'splat' ], [ 'path', 'jpg' ])
  })

  it('ignores trailing slashes', function () {
    assertMatch('/:id', '/path/', '', [ 'id' ], [ 'path' ])
  })

})
