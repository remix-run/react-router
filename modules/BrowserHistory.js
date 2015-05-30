import DOMHistory from './DOMHistory';
import { getWindowPath, supportsHistory } from './DOMUtils';
import NavigationTypes from './NavigationTypes';

function createRandomKey() {
  return Math.random().toString(36).substr(2);
}

/**
 * A history implementation for DOM environments that support the
 * HTML5 history API (pushState, replaceState, and the popstate event).
 * Provides the cleanest URLs and should always be used in browser
 * environments if possible.
 *
 * Note: BrowserHistory automatically falls back to using full page
 * refreshes if HTML5 history is not available, so URLs are always
 * the same across browsers.
 */
export class BrowserHistory extends DOMHistory {

  constructor(getScrollPosition) {
    super(getScrollPosition);
    this.handlePopState = this.handlePopState.bind(this);
    this.isSupported = supportsHistory();
  }

  _updateLocation(navigationType) {
    var key = null;

    if (this.isSupported) {
      var state = window.history.state;
      key = state && state.key;

      if (!key) {
        key = createRandomKey();
        window.history.replaceState({ key }, '');
      }
    }

    this.location = this._createLocation(getWindowPath(), key, navigationType);
  }

  handlePopState(event) {
    if (event.state === undefined)
      return; // Ignore extraneous popstate events in WebKit.

    this._updateLocation(NavigationTypes.POP);
    this._notifyChange();
  }

  addChangeListener(listener) {
    super.addChangeListener(listener);

    if (this.changeListeners.length === 1) {
      if (window.addEventListener) {
        window.addEventListener('popstate', this.handlePopState, false);
      } else {
        window.attachEvent('onpopstate', this.handlePopState);
      }
    }
  }

  removeChangeListener(listener) {
    super.removeChangeListener(listener);

    if (this.changeListeners.length === 0) {
      if (window.removeEventListener) {
        window.removeEventListener('popstate', this.handlePopState, false);
      } else {
        window.removeEvent('onpopstate', this.handlePopState);
      }
    }
  }

  setup() {
    if (this.location == null)
      this._updateLocation();
  }

  // http://www.w3.org/TR/2011/WD-html5-20110113/history.html#dom-history-pushstate
  push(path) {
    if (this.isSupported) {
      this._recordScrollPosition();

      var key = createRandomKey();
      window.history.pushState({ key }, '', path);
      this.location = this._createLocation(path, key, NavigationTypes.PUSH);
      this._notifyChange();
    } else {
      window.location = path;
    }
  }

  // http://www.w3.org/TR/2011/WD-html5-20110113/history.html#dom-history-replacestate
  replace(path) {
    if (this.isSupported) {
      var key = createRandomKey();
      window.history.replaceState({ key }, '', path);
      this.location = this._createLocation(path, key, NavigationTypes.REPLACE);
      this._notifyChange();
    } else {
      window.location.replace(path);
    }
  }

}

export default new BrowserHistory;
