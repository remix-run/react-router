var ExecutionEnvironment = require('react/lib/ExecutionEnvironment');
var invariant = require('react/lib/invariant');
var warning = require('react/lib/warning');
var Location = require('../helpers/Location');

var EventEmitter = require('event-emitter');
var _events = EventEmitter();

var _location;
var _locationHandler;

function notifyChange() {
  _events.emit('change');
}

/**
 * The URLStore keeps track of the current URL. In DOM environments, it may be
 * attached to window.location to automatically sync with the URL in a browser's
 * location bar. <Route>s subscribe to the URLStore to know when the URL changes.
 */
var URLStore = {

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
  },

  /**
   * Returns the type of navigation that is currently being used.
   */
  getLocation: function () {
    return _location || 'hash';
  },

  /**
   * Returns the value of the current URL path.
   */
  getCurrentPath: function () {
    return _locationHandler.getCurrentPath();
  },

  /**
   * Pushes the given path onto the browser navigation stack.
   */
  push: function (path) {
    if (path === this.getCurrentPath())
      return;

    _locationHandler.push(path);
  },

  /**
   * Replaces the current URL path with the given path without adding an entry
   * to the browser's history.
   */
  replace: function (path) {
    _locationHandler.replace(path);
  },

  /**
   * Reverts the URL to whatever it was before the last update.
   */
  back: function () {
    _locationHandler.back();
  },

  /**
   * Returns true if the URL store has already been setup.
   */
  isSetup: function () {
    return _location != null;
  },

  /**
   * Sets up the URL store to get the value of the current path from window.location
   * as it changes. The location argument may be either "hash" or "history".
   */
  setup: function (location) {
    invariant(
      ExecutionEnvironment.canUseDOM,
      'You cannot setup the URL store in an environment with no DOM'
    );

    if (_location != null) {
      warning(
        _location === location,
        'The URL store was already setup using ' + _location + ' location. ' +
        'You cannot use ' + location + ' location on the same page'
      );

      return; // Don't setup twice.
    }

    if (location === 'history' && !supportsHistory()) {
      location = 'disabled';
    }

    _location = location;
    _locationHandler = Location[location];

    invariant(
      _locationHandler,
      'The URL store location "' + location + '" is not valid. ' +
      'It must be any of: ' + Object.keys(Location)
    );

    _locationHandler.init(notifyChange);
  },

  /**
   * Stops listening for changes to window.location.
   */
  teardown: function () {
    if (_location == null)
      return;

    _locationHandler.destroy();
    _location = null;
    _locationHandler = null;
  }

};

function supportsHistory() {
  /*! taken from modernizr
   * https://github.com/Modernizr/Modernizr/blob/master/LICENSE
   * https://github.com/Modernizr/Modernizr/blob/master/feature-detects/history.js
   */
  var ua = navigator.userAgent;
  if ((ua.indexOf('Android 2.') !== -1 ||
      (ua.indexOf('Android 4.0') !== -1)) &&
      ua.indexOf('Mobile Safari') !== -1 &&
      ua.indexOf('Chrome') === -1) {
    return false;
  }
  return (window.history && 'pushState' in window.history);
}

module.exports = URLStore;
