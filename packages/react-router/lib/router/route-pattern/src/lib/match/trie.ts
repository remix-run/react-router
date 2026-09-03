import type { RoutePattern } from '../route-pattern.ts'
import { generatePathnameVariants, type Param } from './variant.ts'
import { unreachable } from '../unreachable.ts'

import type { Match, MatchParamMeta } from './types.ts'

export class Trie<data = unknown> {
  readonly ignoreCase: boolean
  #root: PathnameNode<data>

  constructor(options?: { ignoreCase?: boolean }) {
    this.ignoreCase = options?.ignoreCase ?? false
    this.#root = createPathnameNode()
  }

  insert(pattern: RoutePattern, data: data): void {
    for (let variant of generatePathnameVariants(pattern.pathname, {
      ignoreCase: this.ignoreCase,
    })) {
      let pathnameNode = this.#root
      for (let segment of variant) {
        if (segment.type === 'static') {
          let key = this.ignoreCase ? segment.key.toLowerCase() : segment.key
          let next = pathnameNode.static.get(key)
          if (next === undefined) {
            next = createPathnameNode()
            pathnameNode.static.set(key, next)
          }
          pathnameNode = next
          continue
        }
        if (segment.type === 'variable') {
          let next = pathnameNode.variable.get(segment.key)
          if (next === undefined) {
            next = { regexp: segment.regexp, pathnameNode: createPathnameNode() }
            pathnameNode.variable.set(segment.key, next)
          }
          pathnameNode = next.pathnameNode
          continue
        }
        if (segment.type === 'wildcard') {
          let next = pathnameNode.wildcard.get(segment.key)
          if (next === undefined) {
            next = { regexp: segment.regexp, pathnameNode: createPathnameNode() }
            pathnameNode.wildcard.set(segment.key, next)
          }
          pathnameNode = next.pathnameNode
          continue
        }
        unreachable(segment)
      }

      let requiredParams: Array<Param> = []
      for (let segment of variant) {
        if (segment.type === 'variable' || segment.type === 'wildcard') {
          for (let param of segment.params) requiredParams.push(param)
        }
      }

      pathnameNode.values.push({ pattern, data, requiredParams })
    }
  }

  search(url: URL): Array<Match<string, data>> {
    let results: Array<Match<string, data>> = []
    let urlSegments = normalizePathname(url.pathname)
    if (urlSegments === null) return results

    let stack: Array<{
      segmentIndex: number
      pathnameNode: PathnameNode<data>
      charOffset: number
      captures: Array<{ value: string; begin: number; end: number }>
    }> = [{ segmentIndex: 0, pathnameNode: this.#root, charOffset: 0, captures: [] }]

    while (stack.length > 0) {
      let current = stack.pop()!

      if (current.segmentIndex === urlSegments.length) {
        for (let value of current.pathnameNode.values) {
          let pathnameMatch: Array<MatchParamMeta> = []
          for (let i = 0; i < value.requiredParams.length; i++) {
            let param = value.requiredParams[i]
            let cap = current.captures[i]
            pathnameMatch.push({
              type: param.type,
              name: param.name,
              value: fastDecodeURIComponent(cap.value),
              begin: cap.begin,
              end: cap.end,
            })
          }

          let params: Record<string, string | undefined> = {}
          for (let token of value.pattern.pathname.tokens) {
            if ((token.type === ':' || token.type === '*') && token.name !== '*') {
              params[token.name] = undefined
            }
          }
          for (let param of pathnameMatch) {
            if (param.name !== '*') params[param.name] = param.value
          }

          results.push({
            url,
            pattern: value.pattern,
            data: value.data,
            params,
            paramsMeta: { hostname: [], pathname: pathnameMatch },
          })
        }
        continue
      }

      let urlSegment = urlSegments[current.segmentIndex]
      let staticKey = this.ignoreCase ? urlSegment.toLowerCase() : urlSegment
      let nextStatic = current.pathnameNode.static.get(staticKey)
      if (nextStatic) {
        stack.push({
          segmentIndex: current.segmentIndex + 1,
          pathnameNode: nextStatic,
          charOffset: current.charOffset + urlSegment.length + 1,
          captures: current.captures,
        })
      }

      for (let { regexp, pathnameNode } of current.pathnameNode.variable.values()) {
        let match = regexp.exec(urlSegment)
        if (!match) continue
        let captures = current.captures.slice()
        for (let i = 1; i < match.indices!.length; i++) {
          let span = match.indices![i]
          if (span === undefined) unreachable()
          captures.push({
            value: match[i],
            begin: current.charOffset + span[0],
            end: current.charOffset + span[1],
          })
        }
        stack.push({
          segmentIndex: current.segmentIndex + 1,
          pathnameNode,
          charOffset: current.charOffset + match.index + match[0].length + 1,
          captures,
        })
      }

      for (let { regexp, pathnameNode } of current.pathnameNode.wildcard.values()) {
        let remaining = urlSegments.slice(current.segmentIndex).join('/')
        let match = regexp.exec(remaining)
        if (!match) continue
        let captures = current.captures.slice()
        for (let i = 1; i < match.indices!.length; i++) {
          let span = match.indices![i]
          if (span === undefined) continue
          captures.push({
            value: match[i],
            begin: current.charOffset + span[0],
            end: current.charOffset + span[1],
          })
        }
        stack.push({
          segmentIndex: urlSegments.length,
          pathnameNode,
          charOffset: current.charOffset + remaining.length,
          captures,
        })
      }
    }

    return results
  }
}

// Pathname codec ----------------------------------------------------------------------------------

// Pathname matching uses canonical percent-encoded text. URL pathnames are split on structural
// "/" before normalization so encoded slashes like "%2F" remain data within a segment instead of
// becoming separators. Pattern static text is encoded the same way when variants are generated.
function normalizePathname(pathname: string): string[] | null {
  let segments: string[] = []

  for (let segment of pathname.slice(1).split('/')) {
    let normalized = normalizePathnameText(segment)
    if (normalized === null) return null
    segments.push(normalized)
  }

  return segments
}

function normalizePathnameText(text: string): string | null {
  let decoded = safeDecodeURIComponent(text)
  return decoded === null ? null : encodeURIComponent(decoded)
}

function fastDecodeURIComponent(text: string): string {
  return text.includes('%') ? decodeURIComponent(text) : text
}

function safeDecodeURIComponent(text: string): string | null {
  try {
    return fastDecodeURIComponent(text)
  } catch (error) {
    if (error instanceof URIError) return null
    throw error
  }
}

// Trie nodes --------------------------------------------------------------------------------------

type PathnameNode<data> = {
  static: Map<string, PathnameNode<data>>
  variable: Map<string, { regexp: RegExp; pathnameNode: PathnameNode<data> }>
  wildcard: Map<string, { regexp: RegExp; pathnameNode: PathnameNode<data> }>
  values: Array<{
    pattern: RoutePattern
    data: data
    requiredParams: Array<Param>
  }>
}

function createPathnameNode<data>(): PathnameNode<data> {
  return { static: new Map(), variable: new Map(), wildcard: new Map(), values: [] }
}
