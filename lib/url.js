var subscriptions = [];

export function subscribe(fn) {
  // components seem to mount children first?
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
  location.hash = path;
};

export function init() {
  addSlash();
  window.addEventListener('hashchange', handleHashchange, false);
};

function handleHashchange() {
  var path = getPath();
  for (var i = 0, l = subscriptions.length; i < l; i++) {
    // some components unmount during the loop (they were a child that is no
    // longer active) and therefore the subscriptions array has been mutated,
    // probably a better way to handle this, but not going to worry about it
    // for now.
    if (!subscriptions[i]) {
      continue;
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
  return window.location.hash.substr(1);
}

