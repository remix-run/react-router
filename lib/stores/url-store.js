var HISTORY_EVENTS = {
  hash: 'hashchange',
  history: 'popstate'
};

var _location;

export function getLocation() {
  return _location || 'hash';
}

export function setup(location) {
  if (_location)
    throw new Error('Cannot setup URL twice');

  var historyEvent = HISTORY_EVENTS[location];

  if (!historyEvent)
    throw new Error('Invalid URL location: ' + location);

  _location = location;

  if (location === 'hash' && getCurrentPathUsingLocation(location) === '')
    pushHash('/');

  window.addEventListener(historyEvent, handleStateChange, false);

  handleStateChange();
}

export function teardown() {
  if (!_location)
    return;

  window.removeEventListener(HISTORY_EVENTS[_location], handleStateChange);

  _location = null;
}

var _currentPath;

export function getCurrentPath() {
  return _currentPath;
}

export function updateCurrentPath(path) {
  _currentPath = path;
  notifyChange();
}

function getCurrentPathUsingLocation(location) {
  var pathname = location === 'history' ? window.location.pathname : window.location.hash.substr(1);
  return pathname.replace(/^\//, '');
}

function handleStateChange() {
  updateCurrentPath(getCurrentPathUsingLocation(_location));
}

export function push(path) {
  return getLocation() === 'history' ? pushHistory(path) : pushHash(path);
}

function pushHash(path) {
  window.location.hash = path;
}

function pushHistory(path) {
  window.history.pushState({path: path}, '', path);
  handleStateChange();
}

export function replace(path) {
  return getLocation() === 'history' ? replaceHistory(path) : replaceHash(path);
}

function replaceHash(path) {
  window.location.replace(path);
}

function replaceHistory(path) {
  window.history.replaceState({path: path}, '', path);
  handleStateChange();
}

// TODO: pubsub could probably be its own module.

var _subscriptions = [];

export function subscribe(fn) {
  _subscriptions.push(fn);
}

export function unsubscribe(fn) {
  for (var i = 0, l = _subscriptions.length; i < l; i++) {
    if (_subscriptions[i] === fn) {
      _subscriptions.splice(i, 1);
      break;
    }
  }
}

function notifyChange() {
  for (var i = 0, l = _subscriptions.length; i < l; i++) {
    if (_subscriptions[i] == null) {
      // some views may get wiped out during mid loop and so the subscription
      // is gone, so just bail
      return;
    }
    _subscriptions[i]();
  }
}
