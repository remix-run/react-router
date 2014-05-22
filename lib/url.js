module routeStore from './route-store';
var subscriptions = [];
var location;
var root;

export function subscribe(fn) {
  // ui is built up "backwards" starting with lowest matched child route's
  // handler, so to get subscriptions to trigger with parent's first, unshift
  // instead of push
  subscriptions.push(fn);
};

export function unsubscribe(fn) {
  for (var i = 0, l = subscriptions.length; i < l; i++) {
    if (subscriptions[i] === fn) {
      subscriptions.splice(i, 1);
      break;
    }
  }
};

export function push(path) {
  if (location === 'history') {
    window.history.pushState({path: path}, '', path);
    handleRouteChange();
  } else {
    window.location.hash = path;
  }
};

export function init(_location) {
  location = _location || 'hash';
  console.log(location);
  if (location === 'history') {
    window.addEventListener('popstate', handleRouteChange, false);
  } else {
    addSlash();
    window.addEventListener('hashchange', handleRouteChange, false);
  }
  handleRouteChange();
};

export function getLocation() {
  return location;
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

export function getPath() {
  if (location === 'history') {
    return window.location.pathname.replace(/^\//, '');
  } else {
    return window.location.hash.substr(1).replace(/^\//, '');
  }
}

