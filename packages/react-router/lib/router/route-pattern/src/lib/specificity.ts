import type { Match } from './match/types.ts'

/**
 * Returns true if match `a` is less specific than match `b`.
 *
 * @param a the first match to compare
 * @param b the second match to compare
 * @returns true if `a` is less specific than `b`
 */
export function lessThan(a: Match, b: Match): boolean {
  return compare(a, b) === -1
}

/**
 * Returns true if match `a` is more specific than match `b`.
 *
 * @param a the first match to compare
 * @param b the second match to compare
 * @returns true if `a` is more specific than `b`
 */
export function greaterThan(a: Match, b: Match): boolean {
  return compare(a, b) === 1
}

/**
 * Returns true if matches `a` and `b` have equal specificity.
 *
 * @param a the first match to compare
 * @param b the second match to compare
 * @returns true if `a` and `b` have equal specificity
 */
export function equal(a: Match, b: Match): boolean {
  return compare(a, b) === 0
}

/**
 * Comparator function for sorting matches from least specific to most specific.
 *
 * @param a the first match to compare
 * @param b the second match to compare
 * @returns negative if `a` is less specific, positive if more specific, 0 if equal
 */
export const ascending = (a: Match, b: Match): number => compare(a, b)

/**
 * Comparator function for sorting matches from most specific to least specific.
 *
 * @param a the first match to compare
 * @param b the second match to compare
 * @returns positive if `a` is less specific, negative if more specific, 0 if equal
 */
export const descending = (a: Match, b: Match): number => compare(a, b) * -1

/**
 * Compare two matches by specificity.
 * Passing to `.sort()` will sort matches from least specific to most specific.
 *
 * @param a the first match to compare
 * @param b the second match to compare
 * @returns -1 if `a` is less specific, 1 if `a` is more specific, 0 if tied.
 */
export function compare(a: Match, b: Match): -1 | 0 | 1 {
  return comparePathname(a.paramsMeta.pathname, b.paramsMeta.pathname)
}

function comparePathname(
  a: Match['paramsMeta']['pathname'],
  b: Match['paramsMeta']['pathname'],
): -1 | 0 | 1 {
  if (a.length === 0 && b.length === 0) return 0
  if (a.length === 0 && b.length > 0) return 1
  if (a.length > 0 && b.length === 0) return -1

  let i = 0
  let aIndex = 0
  let bIndex = 0

  while (aIndex < a.length || bIndex < b.length) {
    let aRange = a[aIndex]
    let bRange = b[bIndex]

    if (aRange === undefined) return 1 // a is fully static from here
    if (bRange === undefined) return -1 // b is fully static from here

    // Skip to the minimum begin of the two current ranges
    i = Math.min(aRange.begin, bRange.begin)

    if (i < aRange.begin) return 1 // a has static content at i
    if (i < bRange.begin) return -1 // b has static content at i

    if (aRange.type === ':' && bRange.type === '*') return 1 // a is more specific
    if (aRange.type === '*' && bRange.type === ':') return -1 // b is more specific

    let minEnd = Math.min(aRange.end, bRange.end)
    i = minEnd

    // Advance range indices if we've reached their ends
    if (i >= aRange.end) aIndex += 1
    if (i >= bRange.end) bIndex += 1
  }

  return 0
}
