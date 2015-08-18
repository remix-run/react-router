import runTransitionHooks from './runTransitionHooks';

/**
 * Router enhancer that runs transition hooks when matching. The callback passed
 * to `router.match()` is called with a third parameter, `redirectInfo`. For
 * safety, all store enhancers must check for the existence of `redirectInfo`
 * -- including this one, to account for the possibility that another enhancer
 * has produced a redirect (unlikely, but should be technically possible).
 *
 * @param {CreateRouter} next - Router-creating function
 * @returns {CreateRouter}
 */
export default function useTransitionHooks(next) {
  return (...args) => {
    const router = next(...args);

    function match(location, callback) {
      const prevState = router.getState();
      router.match(location, (error, nextState, existingRedirectInfo) => {
        if (error || existingRedirectInfo) {
          callback(error, null, existingRedirectInfo);
          return;
        }
        runTransitionHooks(prevState, nextState, (transitionError, redirectInfo) => {
          if (error || redirectInfo) {
            callback(transitionError, null, redirectInfo);
            return;
          }
          callback(null, nextState);
        });
      });
    }

    return {
      ...router,
      match
    };
  };
}
