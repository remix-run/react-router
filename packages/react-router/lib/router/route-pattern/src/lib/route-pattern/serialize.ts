import type { PartPattern, RoutePattern } from '../route-pattern.ts'
import { unreachable } from '../unreachable.ts'

export function serializePattern(pattern: RoutePattern): string {
  let pathname = serializePathname(pattern)
  return '/' + pathname
}

export function serializePathname(pattern: RoutePattern): string {
  return serializePart(pattern.pathname)
}

function escapeText(text: string): string {
  return text.replaceAll(/[:*()\\]/g, '\\$&')
}

export function serializePart(part: PartPattern): string {
  let result = ''
  for (let token of part.tokens) {
    if (token.type === '(' || token.type === ')') {
      result += token.type
      continue
    }

    if (token.type === 'text') {
      result += escapeText(token.text)
      continue
    }

    if (token.type === ':' || token.type === '*') {
      let name = token.name === '*' ? '' : token.name
      result += `${token.type}${name}`
      continue
    }

    if (token.type === 'separator') {
      result += '/'
      continue
    }

    unreachable(token.type)
  }

  return result
}
