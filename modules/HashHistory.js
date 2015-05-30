import DOMHistory from './DOMHistory';
import NavigationTypes from './NavigationTypes';
import { getHashPath, replaceHashPath } from './DOMUtils';
import { isAbsolutePath } from './PathUtils';

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

  constructor(getScrollPosition) {
    super(getScrollPosition);
    this.handleHashChange = this.handleHashChange.bind(this);
  }

  _updateLocation(navigationType) {
    this.location = this._createLocation(getHashPath(), null, navigationType);
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

  setup() {
    if (this.location == null)
      this._updateLocation();
  }

  push(path) {
    this._recordScrollPosition();

    this._ignoreHashChange = true;
    window.location.hash = path;
    this._ignoreHashChange = false;

    this.location = this._createLocation(path, null, NavigationTypes.PUSH);
    this._notifyChange();
  }

  replace(path) {
    this._ignoreHashChange = true;
    replaceHashPath(path);
    this._ignoreHashChange = false;

    this.location = this._createLocation(path, null, NavigationTypes.REPLACE);
    this._notifyChange();
  }

  makeHref(path) {
    return '#' + path;
  }

}

export default new HashHistory;
