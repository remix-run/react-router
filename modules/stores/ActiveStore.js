var _activeRoutes = [];

function routeIsActive(routeName) {
  return _activeRoutes.some(function (route) {
    return route.name === routeName;
  });
}

var _activeParams = {};

function paramsAreActive(params) {
  for (var property in params) {
    if (_activeParams[property] !== String(params[property]))
      return false;
  }

  return true;
}

var _activeQuery = {};

function queryIsActive(query) {
  for (var property in query) {
    if (_activeQuery[property] !== String(query[property]))
      return false;
  }

  return true;
}

var EventEmitter = require('event-emitter');
var _events = EventEmitter();

function notifyChange() {
  _events.emit('change');
}

/**
 * The ActiveStore keeps track of which routes, URL and query parameters are
 * currently active on a page. <Link>s subscribe to the ActiveStore to know
 * whether or not they are active.
 */
var ActiveStore = {

  update: function (state) {
    state = state || {};
    _activeRoutes = state.routes || [];
    _activeParams = state.params || {};
    _activeQuery = state.query || {};
    notifyChange();
  },

  /**
   * Returns true if the route with the given name, URL parameters, and query
   * are all currently active.
   */
  isActive: function (routeName, params, query) {
    var isActive = routeIsActive(routeName) && paramsAreActive(params);

    if (query)
      isActive = isActive && queryIsActive(query);

    return isActive;
  },

  /**
   * Adds a listener that will be called when this store changes.
   */
  addChangeListener: function (listener) {
    _events.on('change', listener);
  },

  /**
   * Removes the given change listener.
   */
  removeChangeListener: function (listener) {
    _events.off('change', listener);
  }

};

module.exports = ActiveStore;
