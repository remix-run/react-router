/**
 * Returns a new match function that is called recursively until there are
 * no more redirects.
 * @param {Match} match
 * @return {Match} New match
 */
export default function matchUntilResolved(match) {
  return (prevState, location, callback) => {
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
