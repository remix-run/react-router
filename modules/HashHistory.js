import DOMHistory from './DOMHistory';
import NavigationTypes from './NavigationTypes';
import { getHashPath, getWindowScrollPosition, replaceHashPath } from './DOMUtils';
import { isAbsolutePath } from './URLUtils';
import Location from './Location';

function ensureSlash() {
  var path = getHashPath();

  if (isAbsolutePath(path))
    return true;

  replaceHashPath('/' + path);

  return false;
}

/**
 * A history implementation for DOM environments that uses window.location.hash
 * to store the current path. This is essentially a hack for older browsers that
 * do not support the HTML5 history API (IE <= 9).
 */
export class HashHistory extends DOMHistory {

  constructor(getScrollPosition=getWindowScrollPosition) {
    super();
    this.getScrollPosition = getScrollPosition;
    this.handleHashChange = this.handleHashChange.bind(this);

    // We keep known states in memory so we don't have to keep a key
    // in the URL. We could have persistence if we did, but we can always
    // add that later if people need it. I suspect that at this point
    // most users who need state are already using BrowserHistory.
    this.states = {};
  }

  _updateLocation(navigationType) {
    var path = getHashPath();
    var state = this.states[path] || null;
    this.location = new Location(state, path, navigationType);
  }

  setup() {
    if (this.location == null) {
      ensureSlash();
      this._updateLocation();
    }
  }

  handleHashChange() {
    if (!this._ignoreHashChange && ensureSlash()) {
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
        window.removeEvent('onhashchange', this.handleHashChange);
      }
    }
  }

  pushState(state, path) {
    var location = this.location;
    var currentState = location && this.states[location.path];

    if (currentState) {
      Object.assign(currentState, this.getScrollPosition());
      this.states[location.path] = currentState;
    }

    state = this._createState(state);
    this.states[path] = state;

    this._ignoreHashChange = true;
    window.location.hash = path;
    this._ignoreHashChange = false;

    this.location = new Location(state, path, NavigationTypes.PUSH);

    this._notifyChange();
  }

  replaceState(state, path) {
    state = this._createState(state);

    var location = this.location;

    if (location && this.states[location.path])
      this.states[location.path] = state;

    this._ignoreHashChange = true;
    replaceHashPath(path);
    this._ignoreHashChange = false;

    this.location = new Location(state, path, NavigationTypes.REPLACE);

    this._notifyChange();
  }

  makeHref(path) {
    return '#' + path;
  }

}

export default new HashHistory;
