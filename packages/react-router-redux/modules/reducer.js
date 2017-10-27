/**
 * This action type will be dispatched when your history
 * receives a location change.
 */
export const LOCATION_CHANGE = '@@router/LOCATION_CHANGE'

const initialState = {
  location: { default: null },
}

/**
 * This reducer will update the state with the most recent location history
 * has transitioned to. This may not be in sync with the router, particularly
 * if you have asynchronously-loaded routes, so reading from and relying on
 * this state is discouraged.
 */
export function routerReducer(state = initialState, { type, payload } = {}) {
  if (type === LOCATION_CHANGE) {
    const { location, namespace } = payload
    return { ...state, location: {
      ...state.location,
      [namespace || 'default']: location,
    }}
  }

  return state
}
