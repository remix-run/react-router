var Promise = require('es6-promise').Promise;

/**
 * Resolves all values in the given stateDescription object
 * and calls the setState function with new state as they resolve.
 */
function resolveAsyncState(stateDescription, setState) {
  if (stateDescription == null)
    return Promise.resolve({});

  var keys = Object.keys(stateDescription);
  
  return Promise.all(
    keys.map(function (key) {
      return Promise.resolve(stateDescription[key]).then(function (value) {
        var newState = {};
        newState[key] = value;
        setState(newState);
      });
    })
  );
}

module.exports = resolveAsyncState;
