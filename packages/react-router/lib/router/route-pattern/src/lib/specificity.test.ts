import * as assert from '@remix-run/assert'
import { describe, it } from '@remix-run/test'

import { createMultiMatcher } from './match.ts'
import type { Match } from './match/types.ts'
import * as Specificity from './specificity.ts'

describe('specificity', () => {
  describe('compare', () => {
    function matchPattern(pattern: string, url: URL): Match | null {
      let matcher = createMultiMatcher()
      matcher.add(pattern, null)
      return matcher.match(url)
    }

    function assertCompare(patterns: [string, string], url: URL | string, expected: -1 | 0 | 1) {
      let parsed = typeof url === 'string' ? new URL(url) : url
      let matchA = matchPattern(patterns[0], parsed)
      let matchB = matchPattern(patterns[1], parsed)

      assert.notEqual(matchA, null, `Pattern A "${patterns[0]}" should match URL "${parsed}"`)
      assert.notEqual(matchB, null, `Pattern B "${patterns[1]}" should match URL "${parsed}"`)

      assert.equal(Specificity.compare(matchA!, matchB!), expected)
    }

    describe('pathname', () => {
      it('ranks static higher than variable', () => {
        assertCompare(
          ['https://example.com/posts/123', 'https://example.com/posts/:id'],
          'https://example.com/posts/123',
          1,
        )
      })

      it('ranks variable higher than wildcard', () => {
        assertCompare(
          ['https://example.com/posts/:id', 'https://example.com/posts/*'],
          'https://example.com/posts/123',
          1,
        )
      })

      it('ties when variables have same range', () => {
        assertCompare(
          ['https://example.com/posts/:id', 'https://example.com/posts/:other'],
          'https://example.com/posts/123',
          0,
        )
      })

      it('ties when wildcards have same range', () => {
        assertCompare(
          ['https://example.com/posts/*', 'https://example.com/posts/*'],
          'https://example.com/posts/123',
          0,
        )
      })

      it('ranks variable with prefix/suffix higher than bare variable', () => {
        assertCompare(
          ['https://example.com/posts-:id', 'https://example.com/:segment'],
          'https://example.com/posts-123',
          1,
        )
      })

      it('ranks wildcard with prefix/suffix higher than bare wildcard', () => {
        assertCompare(
          ['https://example.com/p*', 'https://example.com/*/:id'],
          'https://example.com/posts/123',
          1,
        )
      })

      it('breaks tie on variables and wildcards by subsequent characters', () => {
        assertCompare(
          ['https://example.com/*/123/:id/7*', 'https://example.com/*/123/:id/*'],
          'https://example.com/posts/123/456/789',
          1,
        )
      })

      it('ranks back-to-back variables with static content higher', () => {
        assertCompare(
          ['https://example.com/:a/:b', 'https://example.com/*'],
          'https://example.com/posts/123',
          1,
        )
      })

      it('ranks back-to-back wildcards with static content higher', () => {
        assertCompare(
          ['https://example.com/*/*', 'https://example.com/*'],
          'https://example.com/posts/123',
          1,
        )
      })
    })
  })
})
