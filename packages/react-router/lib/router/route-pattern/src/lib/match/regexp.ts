/**
 * Emulates the `RegExp.escape()` available in all latest browsers and runtimes, but not in Node 22.
 * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/escape#browser_compatibility
 *
 * @param text The text to escape.
 * @returns The escaped text.
 */
export function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')
}
