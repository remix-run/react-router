import matchRoutes from './matchRoutes';

/**
 *  Creates a router.
 *
 *  type RouterState = {
 *    location: Location
 *    routes: Array<Route>,
 *    params: Object
 *  }
 */
export default function createRouter(routes, initialState) {
  let state = initialState;

  /**
   * Update router state in response to new location
   * @param {Location} location - location returned from history
   * @param {Function} callback - Called with (error, nextState)
   */
  function match(location, callback) {
    matchRoutes(routes, location, (error, nextState) => {
      if (error) {
        callback(error);
        return;
      }
      state = { ...nextState, location };
      callback(error, state);
    });
  }

  /**
   * Get current router state.
   * @return {RouterState}
   */
  function getState() {
    return state;
  }

  return {
    match,
    getState
  };
}
