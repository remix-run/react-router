var routeStore = require('./route-store');

var subscriptions = [];
var location;
var root;

function subscribe(fn) {
  // ui is built up "backwards" starting with lowest matched child route's
  // handler, so to get subscriptions to trigger with parent's first, unshift
  // instead of push
  subscriptions.push(fn);
};

function unsubscribe(fn) {
  for (var i = 0, l = subscriptions.length; i < l; i++) {
    if (subscriptions[i] === fn) {
      subscriptions.splice(i, 1);
      break;
    }
  }
};

function push(path) {
  return location === 'history' ? pushHistory(path) : pushHash(path);
};

function replace(path) {
  return location === 'history' ? replaceHistory(path) : replaceHash(path);
};

function init(_location) {
  location = _location || 'hash';
  if (location === 'history') {
    window.addEventListener('popstate', handleRouteChange, false);
  } else {
    addSlash();
    window.addEventListener('hashchange', handleRouteChange, false);
  }
  handleRouteChange();
};

function getLocation() {
  return location;
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
  var href = window.location.href.replace(/#(.+)$/, path);
  window.location.replace(href);
}

function handleRouteChange() {
  var path = getPath();
  for (var i = 0, l = subscriptions.length; i < l; i++) {
    if (subscriptions[i] == null) {
      // some views may get wiped out during mid loop and so the subscription
      // is gone, so just bail
      return;
    }
    subscriptions[i]();
  }
}

function addSlash() {
  var path = getPath();
  if (path === '') {
    window.location.hash = '/';
  }
}

function getPath() {
  if (location === 'history') {
    return window.location.pathname.replace(/^\//, '');
  } else {
    return window.location.hash.substr(1).replace(/^\//, '');
  }
}

module.exports = {
  subscribe: subscribe,
  unsubscribe: unsubscribe,
  push: push,
  replace: replace,
  init: init,
  getLocation: getLocation,
  pushHistory: pushHistory,
  pushHash: pushHash,
  replaceHistory: replaceHistory,
  replaceHash: replaceHash,
  handleRouteChange: handleRouteChange,
  addSlash: addSlash,
  getPath: getPath
};
