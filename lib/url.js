var HISTORY_EVENTS = {
  hash: 'hashchange',
  history: 'popstate'
};

var _location;

export function setup(location) {
  location = location || 'hash';

  if (_location)
    throw new Error('Cannot setup URL twice');

  var historyEvent = HISTORY_EVENTS[location];

  if (!historyEvent)
    throw new Error('Invalid URL location: ' + location);

  _location = location;

  if (_location === 'hash')
    addSlash();

  window.addEventListener(historyEvent, handlePathChange, false);

  handlePathChange();
}

function addSlash() {
  var path = getPath();
  if (path === '') {
    window.location.hash = '/';
  }
}

export function teardown() {
  if (!_location)
    return;

  window.removeEventListener(HISTORY_EVENTS[_location], handlePathChange);

  _location = null;
}

export function getLocation() {
  return _location || 'hash';
}

export function getPath() {
  var pathname = getLocation() === 'hash' ? window.location.hash.substr(1) : window.location.pathname;
  return pathname.replace(/^\//, '');
}

export function makePath(relativePath) {
  return getLocation() === 'hash' ? '#/' + relativePath : '/' + relativePath;
}

export function push(path) {
  return getLocation() === 'hash' ? pushHash(path) : pushHistory(path);
}

export function replace(path) {
  return getLocation() === 'hash' ? replaceHash(path) : replaceHistory(path);
}

function pushHistory(path) {
  window.history.pushState({path: path}, '', path);
  handleRouteChange();
}

function pushHash(path) {
  window.location.hash = path;
}

function replaceHistory(path) {
  window.history.replaceState({path: path}, '', path);
  handleRouteChange();
}

function replaceHash(path) {
  window.location.replace(path);
}

var _subscriptions = [];

export function subscribe(fn) {
  _subscriptions.push(fn);

  if (!_location)
    setup();
}

export function unsubscribe(fn) {
  for (var i = 0, l = _subscriptions.length; i < l; i++) {
    if (_subscriptions[i] === fn) {
      _subscriptions.splice(i, 1);
      break;
    }
  }
}

function handlePathChange() {
  for (var i = 0, l = _subscriptions.length; i < l; i++) {
    if (_subscriptions[i] == null) {
      // some views may get wiped out during mid loop and so the subscription
      // is gone, so just bail
      return;
    }
    _subscriptions[i]();
  }
}
