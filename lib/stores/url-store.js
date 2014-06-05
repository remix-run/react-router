var invariant = require('react/lib/invariant');
var warning = require('react/lib/warning');
var ExecutionEnvironment = require('react/lib/ExecutionEnvironment');
var path = require('../path');

var CHANGE_EVENTS = {
  hash: 'hashchange',
  history: 'popstate'
};

var _location;

/**
 * Returns the type of navigation that is currently being used.
 */
exports.getLocation = getLocation;
function getLocation() {
  return _location || 'hash';
}

/**
 * Returns true if the URL store has already been setup.
 */
exports.isSetup = isSetup;
function isSetup() {
  return _location != null;
}

/**
 * Sets up the URL store to get the value of the current path from window.location
 * as it changes. The location argument may be either "hash" or "history".
 */
exports.setup = setup;
function setup(location) {
  invariant(
    ExecutionEnvironment.canUseDOM,
    'You cannot setup the URL store in an environment with no window'
  );

  if (isSetup()) {
    warning(
      _location === location,
      'The URL store was already setup using ' + _location + ' location, so you cannot use ' + location + ' location on the same page'
    );

    return; // Don't setup twice.
  }

  var changeEvent = CHANGE_EVENTS[location];

  invariant(changeEvent, 'The location "' + location + '" is not valid for the URL store. It should be either "hash" or "history"');

  _location = location;

  if (location === 'hash' && getWindowPathname() === '')
    pushHash('/');

  window.addEventListener(changeEvent, notifyChange, false);

  notifyChange();
}

/**
 * Stops listening for changes to window.location.
 */
exports.teardown = teardown;
function teardown() {
  if (!isSetup())
    return;

  var changeEvent = CHANGE_EVENTS[_location];

  window.removeEventListener(changeEvent, notifyChange, false);

  _location = null;
}

var _currentPath = '';

function updateCurrentPath(newPath) {
  _currentPath = path.normalize(newPath);
  notifyChange();
}

/**
 * Returns the value of the current URL path.
 */
exports.getCurrentPath = getCurrentPath;
function getCurrentPath() {
  return isSetup() ? path.normalize(getWindowPathname()) : _currentPath;
}

function getWindowPathname() {
  return getLocation() === 'hash' ? window.location.hash.substr(1) : window.location.pathname;
}

/**
 * Pushes the given path onto the browser navigation stack.
 */
exports.push = push;
function push(path) {
  if (isSetup()) {
    getLocation() === 'history' ? pushHistory(path) : pushHash(path);
  } else {
    updateCurrentPath(path);
  }
}

function pushHistory(path) {
  window.history.pushState({ path: path }, '', path);
  notifyChange();
}

function pushHash(path) {
  window.location.hash = path;
}

/**
 * Replaces the current URL path with the given path without adding an entry
 * to the browser's history.
 */
exports.replace = replace;
function replace(path) {
  if (isSetup()) {
    getLocation() === 'history' ? replaceHistory(path) : replaceHash(path);
  } else {
    updateCurrentPath(path);
  }
}

function replaceHistory(path) {
  window.history.replaceState({ path: path }, '', path);
  notifyChange();
}

function replaceHash(path) {
  window.location.replace(path);
}

var EventEmitter = require('event-emitter');
var events = EventEmitter();

exports.subscribe = subscribe;
function subscribe(fn) {
  events.on('change', fn);
}

exports.unsubscribe = unsubscribe;
function unsubscribe(fn) {
  events.off('change', fn);
}

function notifyChange() {
  events.emit('change');
}

