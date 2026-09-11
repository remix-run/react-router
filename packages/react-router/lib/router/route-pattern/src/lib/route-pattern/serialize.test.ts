import * as assert from '@remix-run/assert'
import { describe, it } from '@remix-run/test'

import { parsePattern } from './parse.ts'
import {
  serializePathname,
  serializePattern,
} from './serialize.ts'

describe('serializePattern', () => {
  function assertRoundTrip(source: string, expected?: string) {
    assert.equal(serializePattern(parsePattern(source)), expected ?? source)
  }

  it('reconstructs pathname only', () => {
    assertRoundTrip('/posts/:id')
    assertRoundTrip('posts/:id', '/posts/:id')
    assertRoundTrip('/posts(/:id)')
    assertRoundTrip('/', '/')
    assertRoundTrip('', '/')
  })
})

describe('serializePathname', () => {
  function pathnameOf(source: string) {
    return serializePathname(parsePattern(source))
  }

  it('returns pathname or empty string', () => {
    assert.equal(pathnameOf('/posts/:id'), 'posts/:id')
    assert.equal(pathnameOf('posts/:id'), 'posts/:id')
    assert.equal(pathnameOf('/posts(/:id)'), 'posts(/:id)')
    assert.equal(pathnameOf('://example.com'), '')
    assert.equal(pathnameOf('/'), '')
    assert.equal(pathnameOf(''), '')
  })

  it('preserves pathname structure', () => {
    assert.equal(pathnameOf('api/(v:major(.:minor)/)run'), 'api/(v:major(.:minor)/)run')
    assert.equal(
      pathnameOf('*/node_modules/(*path/):package/dist/index.:ext'),
      '*/node_modules/(*path/):package/dist/index.:ext',
    )
  })

  it('emits nameless wildcard as bare *', () => {
    assert.equal(pathnameOf('*'), '*')
  })

  it('escapes special chars in pathname text', () => {
    let pattern = 'a\\:b/c\\*d/e\\(f\\)/g\\\\h'
    assert.equal(pathnameOf(`/${pattern}`), pattern)
  })
})
