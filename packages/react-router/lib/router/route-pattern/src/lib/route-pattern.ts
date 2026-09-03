import { parsePattern } from './route-pattern/parse.ts'
import { serializePattern } from './route-pattern/serialize.ts'

/** A token in a parsed pattern part (hostname or pathname). */
export type PartPatternToken =
  | { readonly type: 'text'; readonly text: string }
  | { readonly type: 'separator' }
  | { readonly type: '(' | ')' }
  | { readonly type: ':' | '*'; readonly name: string }

/** Parsed form of a single URL part (hostname or pathname). */
export type PartPattern = {
  readonly tokens: ReadonlyArray<PartPatternToken>
  /** Maps a `(` token index to the index of its matching `)`. */
  readonly optionals: ReadonlyMap<number, number>
  readonly type: 'hostname' | 'pathname'
}

type ParsedRoutePattern = {
  readonly protocol: 'http' | 'https' | 'http(s)' | null
  readonly hostname: PartPattern | null
  readonly port: string | null
  readonly pathname: PartPattern
  /**
   * Required values keyed by search param name.
   *
   * Follows
   * [WHATWG's application/x-www-form-urlencoded parsing](https://url.spec.whatwg.org/#application/x-www-form-urlencoded) spec
   * (same as [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams#percent_encoding)).
   * For example, `+` is decoded as ` ` (literal space) instead of `%20`.
   *
   * - **Empty `Set`**: key must appear; value may be anything (including empty).
   * - **Non-empty `Set`**: key must appear with all listed values; extra values are OK.
   */
  readonly search: ReadonlyMap<string, ReadonlySet<string>>
}

/** A parsed route pattern */
export class RoutePattern<Source extends string = string> implements ParsedRoutePattern {
  readonly protocol: ParsedRoutePattern['protocol']
  readonly hostname: ParsedRoutePattern['hostname']
  readonly port: ParsedRoutePattern['port']
  readonly pathname: ParsedRoutePattern['pathname']
  readonly search: ParsedRoutePattern['search']
  readonly #source: Source | undefined

  /**
   * Create a new `RoutePattern` by parsing a source string.
   *
   * @param source The route pattern source string.
   * @returns The parsed route pattern.
   */
  static parse<Source extends string>(source: Source): RoutePattern<Source> {
    return parsePattern(source)
  }

  /**
   * Create a new `RoutePattern` from parsed parts of a route pattern.
   *
   * Useful for efficiently deriving new patterns from already parsed patterns.
   * Unless you know what you are doing, you probably want `RoutePattern.parse`.
   *
   * @param parsed Parsed route pattern parts.
   */
  constructor(parsed: ParsedRoutePattern, source?: Source) {
    this.protocol = parsed.protocol
    this.hostname = parsed.hostname
    this.port = parsed.port
    this.pathname = parsed.pathname
    this.search = parsed.search
    this.#source = source
  }

  /** Normalized string representation of this pattern */
  get source(): string {
    return this.#source ?? serializePattern(this)
  }

  /**
   * Returns a string representing this route pattern.
   *
   * @returns The same normalized pattern string as `RoutePattern.source`.
   */
  toString(): string {
    return this.source
  }

}
