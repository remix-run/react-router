import { split, type Span } from './split.ts'
import { RoutePattern } from '../route-pattern.ts'
import type { PartPattern } from '../route-pattern.ts'

const IDENTIFIER_RE = /^[a-zA-Z_$][a-zA-Z_$0-9]*/

/**
 * Parse a route pattern source string
 *
 * @param source The pattern source, e.g. `'/users/:id'` or `'https://:tenant.example.com/dashboard?tab'`.
 * @returns The parsed pattern.
 * @throws {ParseError} When the source is malformed.
 */
export function parsePattern<Source extends string>(source: Source): RoutePattern<Source> {
  let spans = split(source)

  return new RoutePattern<Source>(
    {
      protocol: null,
      hostname: null,
      port: null,
      pathname: spans.pathname
        ? parsePart(source, { span: spans.pathname, type: 'pathname' })
        : parsePart('', { span: [0, 0], type: 'pathname' }),
      search: new Map(),
    },
    spans.protocol || spans.hostname || spans.port || spans.search ? source : undefined,
  )
}

/**
 * Parse a single URL part (hostname or pathname).
 *
 * @private
 */
export function parsePart(
  source: string,
  options: { span?: Span; type: 'hostname' | 'pathname' },
): PartPattern {
  let span = options.span ?? [0, source.length]
  let separator = options.type === 'hostname' ? '.' : '/'

  let tokens: Array<
    | { type: 'text'; text: string }
    | { type: 'separator' }
    | { type: '(' | ')' }
    | { type: ':' | '*'; name: string }
  > = []
  let optionals: Map<number, number> = new Map()

  let appendText = (text: string) => {
    let currentToken = tokens.at(-1)
    if (currentToken?.type === 'text') {
      currentToken.text += text
    } else {
      tokens.push({ type: 'text', text })
    }
  }

  let i = span[0]
  let optionalStack: Array<number> = []
  while (i < span[1]) {
    let char = source[i]

    if (char === '(') {
      optionalStack.push(tokens.length)
      tokens.push({ type: char })
      i += 1
      continue
    }

    if (char === ')') {
      let begin = optionalStack.pop()
      if (begin === undefined) {
        throw new ParseError('unmatched )', source, i)
      }
      optionals.set(begin, tokens.length)
      tokens.push({ type: char })
      i += 1
      continue
    }

    if (char === ':') {
      i += 1
      let name = IDENTIFIER_RE.exec(source.slice(i, span[1]))?.[0]
      if (!name) {
        throw new ParseError('missing variable name', source, i - 1)
      }
      tokens.push({ type: ':', name })
      i += name.length
      continue
    }

    if (char === '*') {
      i += 1
      let name = IDENTIFIER_RE.exec(source.slice(i, span[1]))?.[0]
      tokens.push({ type: '*', name: name ?? '*' })
      i += name?.length ?? 0
      continue
    }

    if (char === separator) {
      tokens.push({ type: 'separator' })
      i += 1
      continue
    }

    if (char === '\\') {
      if (i + 1 === span[1]) {
        throw new ParseError('dangling escape', source, i)
      }
      let text = source.slice(i + 1, i + 2)
      appendText(text)
      i += 2
      continue
    }

    appendText(char)
    i += 1
  }
  if (optionalStack.length > 0) {
    throw new ParseError('unmatched (', source, optionalStack.at(-1)!)
  }

  return { tokens, optionals, type: options.type }
}

type ParseErrorType =
  | 'unmatched ('
  | 'unmatched )'
  | 'missing variable name'
  | 'dangling escape'

/** Error thrown when a route pattern cannot be parsed. */
export class ParseError extends Error {
  /** The parse failure category. */
  type: ParseErrorType

  /** Original pattern source being parsed. */
  source: string

  /** Character index where parsing failed. */
  index: number

  constructor(type: ParseErrorType, source: string, index: number) {
    let underline = ' '.repeat(index) + '^'
    let message = `${type}\n\n${source}\n${underline}`

    super(message)
    this.name = 'ParseError'
    this.type = type
    this.source = source
    this.index = index
  }
}
