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

  function assertNoMatch(pattern, pathname) {
    expect(matchPattern(pattern, pathname)).toEqual({
      remainingPathname: null,
      paramNames: [],
      paramValues: []
    })
  }

  it('works without params', function () {
    assertMatch('/', '/path', '/path', [], [])
  })

  it('works with named params', function () {
    assertMatch('/:id', '/path', '', [ 'id' ], [ 'path' ])
    assertMatch('/:id.:ext', '/path.jpg', '', [ 'id', 'ext' ], [ 'path', 'jpg' ])
  })

  it('works with named params that contain spaces', function () {
    assertMatch('/:id', '/path+more', '', [ 'id' ], [ 'path+more' ])
    assertMatch('/:id', '/path%20more', '', [ 'id' ], [ 'path more' ])
  })

  it('works with splat params', function () {
    assertMatch('/files/*.*', '/files/path.jpg', '', [ 0, 1 ], [ 'path', 'jpg' ])
  })

  it('ignores trailing slashes', function () {
    assertMatch('/:id', '/path/', '', [ 'id' ], [ 'path' ])
  })

  it('works with greedy splat', function () {
    assertMatch('/*/g', '/greedy/is/good/g', '', [ 0 ], [ 'greedy/is/good' ])
  })

  it('works with greedy and non-greedy splat', function () {
    assertMatch('/*/*.jpg', '/files/path/to/file.jpg', '', [ 0, 1 ], [ 'files/path/to', 'file' ])
  })

  it('works with regexes for params', function () {
    assertMatch('/:int(\\d+)', '/42', '', [ 'int' ], [ '42' ])
    assertNoMatch('/:int(\\d+)', '/foo')
    assertMatch('/:id(foo|bar)', '/foo', '', [ 'id' ], [ 'foo' ])
    assertMatch('/:id(foo|bar)', '/bar', '', [ 'id' ], [ 'bar' ])
    assertNoMatch('/:id(foo|bar)', '/42')
  })

  it('works with anonymous params', function () {
    assertMatch('/(foo|bar)', '/foo', '', [ 0 ], [ 'foo' ])
    assertMatch('/(foo|bar)', '/bar', '', [ 0 ], [ 'bar' ])
  })
})
