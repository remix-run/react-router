import type { PartPattern, PartPatternToken, RoutePattern } from '../route-pattern.ts'
import { escape } from './regexp.ts'
import { unreachable } from '../unreachable.ts'

export type Variant = {
  readonly protocol: 'http' | 'https'
  readonly hostname: { readonly type: 'any' }
  readonly port: ''
  readonly pathname: PathnameVariant
}

export function generateVariants(pattern: RoutePattern): ReadonlyArray<Variant> {
  return generatePathnameVariants(pattern.pathname).flatMap((pathname) => [
    { protocol: 'http', hostname: { type: 'any' }, port: '', pathname },
    { protocol: 'https', hostname: { type: 'any' }, port: '', pathname },
  ])
}

export type Param = Extract<PartPatternToken, { type: ':' | '*' }>

// Pathname ----------------------------------------------------------------------------------------

export type PathnameVariantSegment =
  | { readonly type: 'static'; readonly key: string }
  | {
      readonly type: 'variable'
      readonly key: string
      readonly regexp: RegExp
      readonly params: ReadonlyArray<Param>
    }
  | {
      readonly type: 'wildcard'
      readonly key: string
      readonly regexp: RegExp
      readonly params: ReadonlyArray<Param>
    }

export type PathnameVariant = ReadonlyArray<PathnameVariantSegment>

export function generatePathnameVariants(
  pathname: PartPattern,
  options?: { ignoreCase?: boolean },
): ReadonlyArray<ReadonlyArray<PathnameVariantSegment>> {
  let result: Array<ReadonlyArray<PathnameVariantSegment>> = []
  let ignoreCase = options?.ignoreCase ?? false

  for (let tokens of generatePartVariants(pathname)) {
    let variant: Array<PathnameVariantSegment> = []
    let key = ''
    let reSource = ''
    let reFlags = ignoreCase ? 'di' : 'd'
    let type: 'static' | 'variable' | 'wildcard' = 'static'
    let params: Array<Param> = []

    for (let token of tokens) {
      if (token.type === 'separator') {
        if (type === 'static') {
          variant.push({ type: 'static', key: ignoreCase ? key.toLowerCase() : key })
          key = ''
          reSource = ''
          continue
        }
        if (type === 'variable') {
          variant.push({
            type: 'variable',
            key,
            regexp: new RegExp(`^${reSource}$`, reFlags),
            params,
          })
          key = ''
          reSource = ''
          params = []
          type = 'static'
          continue
        }
        if (type === 'wildcard') {
          key += '/'
          reSource += escape('/')
          continue
        }
        unreachable(type)
      }

      if (token.type === 'text') {
        // Encode to comply with URL pathname normalization in trie matcher
        let text = encodeURIComponent(token.text)
        key += text
        reSource += escape(text)
        continue
      }

      if (token.type === ':') {
        key += '{:}'
        reSource += `([^/]+)`
        params.push(token)
        if (type === 'static') type = 'variable'
        continue
      }

      if (token.type === '*') {
        key += '{*}'
        reSource += `(.*)`
        params.push(token)
        type = 'wildcard'
        continue
      }

      unreachable(token.type)
    }

    if (type === 'static') {
      variant.push({ type: 'static', key: ignoreCase ? key.toLowerCase() : key })
    }
    if (type === 'variable' || type === 'wildcard') {
      variant.push({ type, key, regexp: new RegExp(`^${reSource}$`, reFlags), params })
    }
    result.push(variant)
  }
  return result
}

// Part --------------------------------------------------------------------------------------------

type PartVariantToken = Exclude<PartPatternToken, { type: '(' | ')' }>
type PartVariant = ReadonlyArray<PartVariantToken>

/**
 * Expand a part pattern's optionals into the list of all concrete variants.
 *
 * Each variant is the linear token sequence you'd get by independently choosing
 * to include or omit every `(` `)` group. No nesting, no optional markers.
 *
 * @private
 */
export function generatePartVariants(part: PartPattern): ReadonlyArray<PartVariant> {
  let result: Array<PartVariant> = []
  let stack: Array<{ index: number; tokens: Array<PartVariantToken> }> = [{ index: 0, tokens: [] }]

  while (stack.length > 0) {
    let { index, tokens } = stack.pop()!

    if (index === part.tokens.length) {
      result.push(tokens)
      continue
    }

    let token = part.tokens[index]

    if (token.type === '(') {
      stack.push(
        { index: index + 1, tokens },
        { index: part.optionals.get(index)! + 1, tokens: tokens.slice() },
      )
      continue
    }

    if (token.type === ')') {
      stack.push({ index: index + 1, tokens })
      continue
    }

    if (
      token.type === ':' ||
      token.type === '*' ||
      token.type === 'text' ||
      token.type === 'separator'
    ) {
      tokens.push(token)
      stack.push({ index: index + 1, tokens })
      continue
    }
    unreachable(token.type)
  }
  return result
}
