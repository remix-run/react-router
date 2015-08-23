/**
 * Identity form of `match()` — call callback with previous state. Used to
 * create a match function from a middleware:
 *   const match = middleware(routes)(identityMatch)
 * @param  {RouterState} prevState
 * @param  {Location} location
 * @param  {Function} callback
 */
export default function identityMatch(prevState, location, callback) {
  callback(null, prevState);
}
