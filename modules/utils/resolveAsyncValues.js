var Promise = require('./Promise');

function isPromise(value) {
  return value != null && typeof value.then === 'function';
}

/**
 * Resolves all values in asyncValues and calls setValues(newValues)
 * as they resolve. Calls callback(error) when finished.
 *
 * If a value needs to resolve asynchronously, it may be a promise.
 * Otherwise this operation is synchronous.
 */
function resolveAsyncValues(asyncValues, setValues, callback) {
  if (asyncValues == null)
    return callback();

  var immediateValues = {};
  var promises = [];

  var value;
  for (var property in asyncValues) {
    if (!asyncValues.hasOwnProperty(property))
      continue;

    value = asyncValues[property];

    if (isPromise(value)) {
      promises.push(
        value.then(function (v) {
          var newValues = {};
          newValues[property] = v;
          setValues(newValues);
        })
      );
    } else {
      immediateValues[property] = value;
    }
  }

  setValues(immediateValues);

  if (promises.length) {
    // Use setTimeout to break the promise chain.
    Promise.all(promises).then(function () {
      setTimeout(callback);
    }, function (error) {
      setTimeout(function () {
        callback(error);
      });
    });
  } else {
    callback();
  }
}

module.exports = resolveAsyncValues;
