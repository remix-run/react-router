/**
 * An internal error that should never happen.
 *
 * @param value Typed as `never` to ensure exhaustiveness for discriminated unions.
 */
export function unreachable(value?: never): never {
  let message = value === undefined ? 'Unreachable' : `Unreachable: ${value}`
  throw new Error(message)
}
