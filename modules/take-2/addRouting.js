function identity(t) {
  return t;
}

/**
 * History enhancer that adds routing capabilities. Takes middleware and
 * an initial state.
 *   const createRouter = addRouting(middleware, initialState)(createHistory)
 * @param {Middleware} middleware - defaults to identity function
 * @param {Object} initialState
 */
export default function addRouting(middleware = identity, initialState) {
  return createHistory => historyOptions => {
    const history = createHistory(historyOptions);
    let state = initialState;
    let listeners = [];

    const match = middleware((prevState, location, callback) => {
      callback(null, prevState);
    });

    function listen(listener) {
      listeners.push(listener);
      listener(state);
      return function unlisten() {
        listeners = listeners.filter(l => l !== listener);
      };
    }

    function getState() {
      return state;
    }

    /**
     * @private
     */
    function replaceState(nextState) {
      state = nextState;
      listeners.forEach(l => l(state));
    }

    history.listen(location => {
      replaceState({ ...getState(), pendingLocation: location });

      match(prevState, location, (err, nextState, redirectInfo) => {
        if (error) {
          throw error;
        }

        if (redirectInfo) {
          history.pushState(
            redirectInfo.pathname,
            redirectInfo.query,
            redirectInfo.state
          );
          return;
        }

        // Ensure this is the latest location
        if (location === getState().pendingLocation) {
          replaceState(nextState);
        }
      });
    });

    return {
      ...history,
      listen,
      getState,
      match
    };
  };
}
