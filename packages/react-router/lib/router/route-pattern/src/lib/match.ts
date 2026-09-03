import type { RoutePattern } from './route-pattern.ts'
import { parsePattern } from './route-pattern/parse.ts'

import { Trie } from './match/trie.ts'
import type { Match } from './match/types.ts'
import * as Specificity from './specificity.ts'

export type { Match } from './match/types.ts'

export type MatcherOptions = {
  /**
   * When `true`, pathname matching is case-insensitive for all patterns. Defaults to `false`.
   */
  ignoreCase?: boolean
}

export type MultiMatcher<data = unknown> = {
  readonly ignoreCase: boolean
  add(pattern: string | RoutePattern, data: data): void
  /** Most specific match for `url`, or `null` when nothing matches. */
  match(url: string | URL): Match<string, data> | null
  /** Every match for `url`, sorted from most to least specific. */
  matchAll(url: string | URL): Array<Match<string, data>>
}

/**
 * Create a matcher for multiple route patterns.
 *
 * @param options Options for matching URLs
 * @returns A matcher that can register multiple patterns with associated data
 */
export function createMultiMatcher<data = unknown>(options?: MatcherOptions): MultiMatcher<data> {
  return new TrieMatcher<data>(options)
}

class TrieMatcher<data = unknown> implements MultiMatcher<data> {
  readonly ignoreCase: boolean
  #trie: Trie<data>

  constructor(options?: MatcherOptions) {
    this.ignoreCase = options?.ignoreCase ?? false
    this.#trie = new Trie<data>({ ignoreCase: this.ignoreCase })
  }

  add(pattern: string | RoutePattern, data: data): void {
    pattern = typeof pattern === 'string' ? parsePattern(pattern) : pattern
    this.#trie.insert(pattern, data)
  }

  match(url: string | URL): Match<string, data> | null {
    let parsedUrl = typeof url === 'string' ? new URL(url) : url
    let best: Match<string, data> | null = null
    for (let match of this.#trie.search(parsedUrl)) {
      if (best === null || Specificity.greaterThan(match, best)) {
        best = match
      }
    }
    return best
  }

  matchAll(url: string | URL): Array<Match<string, data>> {
    let parsedUrl = typeof url === 'string' ? new URL(url) : url
    let matches: Array<Match<string, data>> = []
    for (let match of this.#trie.search(parsedUrl)) {
      matches.push(match)
    }
    return matches.sort(Specificity.descending)
  }
}
