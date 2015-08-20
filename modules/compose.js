/**
 * Composes functions from left to right.
 *
 * @param {Array<Function>} funcs - functions to compose.
 * @returns {Function} A function obtained by composing functions from left
 * to right.
 */
export default function compose(...funcs) {
  return funcs.reduceRight((composed, f) => f(composed));
}
