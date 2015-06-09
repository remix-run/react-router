import DOMHistory from './DOMHistory';
import { getWindowPath, getWindowScrollPosition, supportsHistory } from './DOMUtils';
import NavigationTypes from './NavigationTypes';
import Location from './Location';

function updateCurrentState(extraState) {
  var state = window.history.state;

  if (state)
    window.history.replaceState(Object.assign(state, extraState), '');
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

  constructor(getScrollPosition=getWindowScrollPosition) {
    super();
    this.getScrollPosition = getScrollPosition;
    this.handlePopState = this.handlePopState.bind(this);
    this.isSupported = supportsHistory();
  }

  _updateLocation(navigationType) {
    var state = null;

    if (this.isSupported) {
      state = window.history.state || {};

      if (!state.key) {
        state.key = createRandomKey();
        window.history.replaceState(state, '');
      }
    }

    this.location = new Location(getWindowPath(), state, navigationType);
  }

  setup() {
    if (this.location == null)
      this._updateLocation();
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

  // http://www.w3.org/TR/2011/WD-html5-20110113/history.html#dom-history-pushstate
  pushState(state, path) {
    if (this.isSupported) {
      updateCurrentState(this.getScrollPosition());

      state = this._createState(state);

      window.history.pushState(state, '', path);
      this.location = new Location(path, state, NavigationTypes.PUSH);
      this._notifyChange();
    } else {
      window.location = path;
    }
  }

  // http://www.w3.org/TR/2011/WD-html5-20110113/history.html#dom-history-replacestate
  replaceState(state, path) {
    if (this.isSupported) {
      state = this._createState(state);

      window.history.replaceState(state, '', path);
      this.location = new Location(path, state, NavigationTypes.REPLACE);
      this._notifyChange();
    } else {
      window.location.replace(path);
    }
  }

}

export default new BrowserHistory;
