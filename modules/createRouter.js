import identityMiddleware from './identityMiddleware';
import identityMatch from './identityMatch';

const defaults = {
  middleware: identityMiddleware,
  onError: error => { throw error; }
};

export default function createRouter(createHistory) {
  return options => {
    const {
      middleware,
      routes,
      initialState,
      onError,
      ...rest
    } = { ...defaults, ...options };

    const history = createHistory(rest);
    let state;
    let listeners = [];

    const match = middleware(routes)(identityMatch);

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
    function setState(nextState) {
      state = { ...state, ...nextState };
      listeners.forEach(l => l(state));
    }

    history.listen(location => {
      let asyncMatch = true;
      match({ ...getState(), location }, location, (error, nextState, redirectInfo) => {
        asyncMatch = false;
        const { pendingLocation } = getState() || {};

        // Ensure this is the latest location
        if (pendingLocation && location !== pendingLocation) {
          return;
        }

        if (error) {
          throw onError(error);
        }

        if (redirectInfo) {
          history.pushState(
            redirectInfo.state,
            redirectInfo.pathname,
            redirectInfo.query
          );
          return;
        }

        setState({
          ...nextState,
          pendingLocation: null
        });
      });

      // Only set pending location if match is async
      if (asyncMatch) {
        setState({
          pendingLocation: location
        });
      }
    });

    return {
      ...history,
      listen,
      getState,
      match
    };
  };
}
