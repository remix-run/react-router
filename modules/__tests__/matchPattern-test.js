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
    assertMatch('/files/*.*', '/files/path.jpg', '', [ 'splat', 'splat' ], [ 'path', 'jpg' ])
  })

  it('ignores trailing slashes', function () {
    assertMatch('/:id', '/path/', '', [ 'id' ], [ 'path' ])
  })

  it('works with greedy splat (**)', function () {
    assertMatch('/**/g', '/greedy/is/good/g', '', [ 'splat' ], [ 'greedy/is/good' ])
  })

  it('works with greedy and non-greedy splat', function () {
    assertMatch('/**/*.jpg', '/files/path/to/file.jpg', '', [ 'splat', 'splat' ], [ 'files/path/to', 'file' ])
  })

})
