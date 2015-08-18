import warning from 'warning';
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
export default function createRouter(initialState) {
  let state = initialState;

  /**
   * Update router state in response to new location
   * @param {Array<Route>} routes - Route configuration
   * @param {Location} location - location returned from history
   * @param {Function} callback - Called with (error, nextState)
   */
  function match(routes, location, callback) {
    matchRoutes(routes, location, (error, nextState) => {
      if (error) {
        callback(error);
        return;
      }
      if (nextState == null) {
        warning(
          false,
          'Location "%s" did not match any routes',
          location.pathname + location.search
        );
        callback(error, nextState);
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
