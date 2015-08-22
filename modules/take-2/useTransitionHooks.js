import runTransitionHooks from '../runTransitionHooks';

export default function useTransitionHooks(routes) {
  return match => (prevState, location, callback) => {
    // Call downstream middleware first to get next state
    match(prevState, location, (error1, nextState, redirectInfo1) => {
      if (error1 || redirectInfo1) {
        callback(transitionError, null, redirectInfo1);
        return;
      }
      // Run transition hooks using next and previous state
      runTransitionHooks(prevState, nextState, (error2, redirectInfo2) => {
        if (error2 || redirectInfo2) {
          callback(error2, null, redirectInfo2);
          return;
        }
        callback(null, nextState);
      });
    });
  };
}
