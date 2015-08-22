import warning from 'warning';
import matchRoutes from '../matchRoutes';

export default function useRoutes(routes) {
  return match => (prevState, location, callback) => {
    matchRoutes(routes, location, (error1, state) => {
      // State from `matchRoutes()` is *not* complete router state
      // Only has `routes` (active routes) and `params`
      if (error1) {
        callback(error1);
        return;
      }
      if (!state) {
        warning(
          false,
          'Location "%s" did not match any routes',
          location.pathname + location.search
        );
      }
      match({ prevState, ...state }, location, (error2, nextState, redirectInfo) => {
        if (error2 || redirectInfo) {
          callback(error2, null, redirectInfo);
          return;
        }
        callback(null, nextState);
      })
    });
  }
}
