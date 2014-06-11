var invariant = require('react/lib/invariant');
var warning = require('react/lib/warning');
var ExecutionEnvironment = require('react/lib/ExecutionEnvironment');
var normalizePath = require('../path').normalize;

var CHANGE_EVENTS = {
  hash: 'hashchange',
  history: 'popstate'
};

var _location;

function getWindowPathname() {
  return _location === 'history' ? window.location.pathname : window.location.hash.substr(1);
}

function pushHistory(path) {
  window.history.pushState({ path: path }, '', path);
  notifyChange();
}

function pushHash(path) {
  window.location.hash = path;
}

function replaceHistory(path) {
  window.history.replaceState({ path: path }, '', path);
  notifyChange();
}

function replaceHash(path) {
  window.location.replace(path);
}

var _lastPath;
var _currentPath = '/';

function updateCurrentPath(path) {
  _lastPath = _currentPath;
  _currentPath = normalizePath(path);
  notifyChange();
}

var EventEmitter = require('event-emitter');
var _events = EventEmitter();

function notifyChange() {
  _events.emit('change');
}

var URLStore = {

  /**
   * Returns the type of navigation that is currently being used.
   */
  getLocation: function () {
    return _location || 'hash';
  },

  /**
   * Pushes the given path onto the browser navigation stack.
   */
  push: function (path) {
    if (_location != null) {
      _location === 'history' ? pushHistory(path) : pushHash(path);
    } else {
      updateCurrentPath(path);
    }
  },

  /**
   * Replaces the current URL path with the given path without adding an entry
   * to the browser's history.
   */
  replace: function (path) {
    if (_location != null) {
      _location === 'history' ? replaceHistory(path) : replaceHash(path);
    } else {
      updateCurrentPath(path);
    }
  },

  /**
   * Reverts the URL to whatever it was before the last update.
   */
  back: function () {
    if (_location != null) {
      window.history.back();
    } else {
      invariant(
        _lastPath,
        'You cannot make the URL store go back more than once when it does not use the DOM'
      );

      _currentPath = _lastPath;
      _lastPath = null;
      notifyChange();
    }
  },

  /**
   * Returns the value of the current URL path.
   */
  getCurrentPath: function () {
    return _location != null ? getWindowPathname() : _currentPath;
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

    var changeEvent = CHANGE_EVENTS[location];

    invariant(
      changeEvent,
      'The URL store location "' + location + '" is not valid. ' +
      'It must be either "hash" or "history"'
    );

    _location = location;

    if (location === 'hash' && getWindowPathname() === '')
      pushHash('/');

    window.addEventListener(changeEvent, notifyChange, false);
  },

  /**
   * Stops listening for changes to window.location.
   */
  teardown: function () {
    if (_location == null)
      return;

    var changeEvent = CHANGE_EVENTS[_location];

    window.removeEventListener(changeEvent, notifyChange, false);

    _location = null;
  },

  /**
   * Adds a listener that will be called when the URL changes.
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

module.exports = URLStore;
