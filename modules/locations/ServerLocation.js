var invariant = require('react/lib/invariant');
var RouteStore = require('../stores/RouteStore');

var _currentPath = '/';

/**
 * Location handler that does not require a DOM.
 */
var ServerLocation = {

  push: function (path) {
    RouteStore.unregisterAllRoutes();

    var error = new Error("Redirect");
    error.httpStatus = error.status = 302;
    error.location = path;

    throw error;
  },

  replace: function (path) {
    ServerLocation.push(path);
  },

  pop: function () {
    throw new Error('Cannot goBack on server');
  },

  getCurrentPath: function () {
    return _currentPath;
  },

  toString: function () {
    return '<ServerLocation>';
  }

};

module.exports = ServerLocation;
