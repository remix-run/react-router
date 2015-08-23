/**
 * Middleware that matches recursively until there are no more redirects. This
 * should be the first middleware in the chain
 */
export default function matchUntilResolved() {
  return match => (prevState, location, callback) => {
    function matchAgain(state) {
      match(state, location, (error, newState, redirectInfo) => {
        if (error) {
          callback(error);
          return;
        }
        if (redirectInfo) {
          matchAgain(newState);
          return;
        }
        callback(null, newState);
      });
    }
    matchAgain(prevState);
  }
}
