import getComponents from './getComponents';

/**
 * Router enhancer that gets (possibly asynchronously) the components needed
 * to render the active routes and adds it to the router state.
 *
 * @param {CreateRouter} createRouter - Router-creating function
 * @returns {CreateRouter}
 */
export default function useComponents(createRouter) {
  return (...args) => {
    const router = createRouter(...args);
    let components;

    function match(location, callback) {
      router.match(location, (error, nextState, redirectInfo) => {
        if (error || redirectInfo) {
          callback(error, null, redirectInfo);
          return;
        }
        // TODO: the first arg to `getComponents()` should just be `activeRoutes`
        getComponents({ routes: nextState.routes }, (error, nextComponents) => {
          if (error) {
            callback(error);
            return;
          }
          components = nextComponents;
          callback(null, getState());
        });
      });
    }

    function getState() {
      return {
        ...router.getState(),
        components
      };
    }

    return {
      ...router,
      match,
      getState
    };
  }
}
