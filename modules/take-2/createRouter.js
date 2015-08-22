export default function createRouter(createHistory) {
  return options => {
    const {
      middleware,
      routes,
      initialState,
      ...rest
    } = options;

    const history = createHistory(rest);
    let state;

    const match = middleware(routes)((prevState, location, callback) => {
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
        // Ensure this is the latest location
        if (location === getState().pendingLocation) {
          return;
        }

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

        replaceState(nextState);
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
