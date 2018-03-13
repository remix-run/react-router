/**
 * This action type will be dispatched when your history
 * receives a location change.
 */
export const LOCATION_CHANGE = "@@router/LOCATION_CHANGE";

const initialState = {
  location: null,
  action: null
};

/**
 * This reducer will update the state with the most recent location history
 * has transitioned to. This may not be in sync with the router, particularly
 * if you have asynchronously-loaded routes, so reading from and relying on
 * this state is discouraged.
 */
export function routerReducer(state = initialState, { type, payload } = {}) {
  if (type === LOCATION_CHANGE) {
    const { location, action } = payload || {};

    return { ...state, location, action };
  }

  return state;
}
