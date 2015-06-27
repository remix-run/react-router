import warning from 'warning';
import DOMHistory from './DOMHistory';
import NavigationTypes from './NavigationTypes';
import { getHashPath, replaceHashPath } from './DOMUtils';
import { isAbsolutePath } from './URLUtils';

var instance = null;
var DefaultQueryKey = '_qk';

function ensureSlash() {
  var path = getHashPath();

  if (isAbsolutePath(path))
    return true;

  replaceHashPath('/' + path);

  return false;
}

function addQueryStringValueToPath(path, key, value) {
  return path + (path.indexOf('?') === -1 ? '?' : '&') + `${key}=${value}`;
}

function getQueryStringValueFromPath(path, key) {
  var match = path.match(new RegExp(`\\?.*?\\b${key}=(.+?)\\b`));
  return match && match[1];
}

function saveState(path, queryKey, state) {
  window.sessionStorage.setItem(state.key, JSON.stringify(state));
  return addQueryStringValueToPath(path, queryKey, state.key);
}

function readState(path, queryKey) {
  var sessionKey = getQueryStringValueFromPath(path, queryKey);
  var json = sessionKey && window.sessionStorage.getItem(sessionKey);

  if (json) {
    try {
      return JSON.parse(json);
    } catch (error) {
      // Ignore invalid JSON in session storage.
    }
  }

  return null;
}

function updateCurrentState(queryKey, extraState) {
  var path = getHashPath();
  var state = readState(path, queryKey);

  if (state)
    saveState(path, queryKey, Object.assign(state, extraState));
}

/**
 * A history implementation for DOM environments that uses window.location.hash
 * to store the current path. This is essentially a hack for older browsers that
 * do not support the HTML5 history API (IE <= 9).
 *
 * Support for persistence of state across page refreshes is provided using a
 * combination of a URL query string parameter and DOM storage. However, this
 * support is not enabled by default. In order to use it, create your own
 * HashHistory.
 *
 *   import HashHistory from 'react-router/lib/HashHistory';
 *   var StatefulHashHistory = new HashHistory({ queryKey: '_key' });
 *   React.render(<Router history={StatefulHashHistory} .../>, ...);
 */
class HashHistory extends DOMHistory {

  constructor(options={}) {
    super(options);
    this.handleHashChange = this.handleHashChange.bind(this);
    this.queryKey = options.queryKey;

    if (typeof this.queryKey !== 'string')
      this.queryKey = this.queryKey ? DefaultQueryKey : null;
  }

  _updateLocation(navigationType) {
    var path = getHashPath();
    var state = this.queryKey ? readState(path, this.queryKey) : null;
    this.location = this.createLocation(path, state, navigationType);
  }

  setup() {
    if (this.location == null) {
      ensureSlash();
      this._updateLocation();
    }
  }

  handleHashChange() {
    if (!ensureSlash())
      return;

    if (this._ignoreNextHashChange) {
      this._ignoreNextHashChange = false;
    } else {
      this._updateLocation(NavigationTypes.POP);
      this._notifyChange();
    }
  }

  addChangeListener(listener) {
    super.addChangeListener(listener);

    if (this.changeListeners.length === 1) {
      if (window.addEventListener) {
        window.addEventListener('hashchange', this.handleHashChange, false);
      } else {
        window.attachEvent('onhashchange', this.handleHashChange);
      }
    }
  }

  removeChangeListener(listener) {
    super.removeChangeListener(listener);

    if (this.changeListeners.length === 0) {
      if (window.removeEventListener) {
        window.removeEventListener('hashchange', this.handleHashChange, false);
      } else {
        window.detachEvent('onhashchange', this.handleHashChange);
      }
    }
  }

  pushState(state, path) {
    warning(
      this.queryKey || state == null,
      'HashHistory needs a queryKey in order to persist state'
    );

    if (this.queryKey)
      updateCurrentState(this.queryKey, this.getScrollPosition());

    state = this._createState(state);

    if (this.queryKey)
      path = saveState(path, this.queryKey, state);

    this._ignoreNextHashChange = true;
    window.location.hash = path;

    this.location = this.createLocation(path, state, NavigationTypes.PUSH);

    this._notifyChange();
  }

  replaceState(state, path) {
    state = this._createState(state);

    if (this.queryKey)
      path = saveState(path, this.queryKey, state);

    this._ignoreNextHashChange = true;
    replaceHashPath(path);

    this.location = this.createLocation(path, state, NavigationTypes.REPLACE);

    this._notifyChange();
  }

  makeHref(path) {
    return '#' + path;
  }

  static history() {
    instance = instance || new HashHistory();
    return instance;
  }
}

export default HashHistory;
