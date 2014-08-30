var Promise = require('when/lib/Promise');

/**
 * Resolves all values in asyncState and calls the setState
 * function with new state as they resolve. Returns a promise
 * that resolves after all values are resolved.
 */
function resolveAsyncState(asyncState, setState) {
  if (asyncState == null)
    return Promise.resolve();

  var keys = Object.keys(asyncState);
  
  return Promise.all(
    keys.map(function (key) {
      return Promise.resolve(asyncState[key]).then(function (value) {
        var newState = {};
        newState[key] = value;
        setState(newState);
      });
    })
  );
}

module.exports = resolveAsyncState;
