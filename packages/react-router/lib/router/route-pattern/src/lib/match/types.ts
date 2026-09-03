import type { RoutePattern } from '../route-pattern.ts'

/** Params extracted from a route pattern match. */
export type MatchParams = Record<string, string | undefined>

export type MatchParamMeta = {
  type: ':' | '*'
  name: string
  value: string
  /** Start offset after pathname is normalized. */
  begin: number
  /** End offset after pathname is normalized. */
  end: number
}

export type Match<source extends string = string, data = unknown> = {
  url: URL
  pattern: RoutePattern<source>
  data: data
  params: MatchParams
  paramsMeta: {
    hostname: ReadonlyArray<MatchParamMeta>
    pathname: ReadonlyArray<MatchParamMeta>
  }
}
