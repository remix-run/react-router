import { Location } from "react-router"

const isObjectWithKey = <T extends string>(
  given: unknown,
  key: T
): given is Partial<Record<T, unknown>> =>
  typeof given === 'object' && given !== null && key in given

export const getPathname = (location: Location): string | undefined => {
  const { state } = location
  // Note that doing e.g.: const state = location.state as { from: Location }
  // as suggested elsewhere isn't type safe and you risk runtime errors when doing it that way.
  return isObjectWithKey(state, 'from') &&
    isObjectWithKey(state.from, 'pathname') &&
    typeof state.from.pathname === 'string'
    ? state.from.pathname
    : undefined
}
