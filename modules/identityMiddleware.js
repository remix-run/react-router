/**
 * A middleware that does nothing
 */
export default function identityMiddleware() {
  return match => match
}
