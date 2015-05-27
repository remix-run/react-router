import DOMHistory from './DOMHistory';
import { getWindowPath, supportsHistory } from './DOMUtils';
import NavigationTypes from './NavigationTypes';
import assign from 'object-assign';

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
class BrowserHistory extends DOMHistory {

  static propTypes = assign({}, DOMHistory.propTypes);
  static defaultProps = assign({}, DOMHistory.defaultProps);
  static childContextTypes = assign({}, DOMHistory.childContextTypes);

  constructor(props, context) {
    super(props, context);
    this.handlePopState = this.handlePopState.bind(this);
    this.isSupported = supportsHistory();
  }

  _updateLocation(navigationType) {
    var [ path, queryString ] = getWindowPath().split('?', 2);
    var key = null;

    if (this.isSupported) {
      var state = window.history.state;
      key = state && state.key;

      if (!key) {
        key = createRandomKey();
        window.history.replaceState({ key }, '');
      }
    }

    this.setState({
      location: this.createLocation(path, this.parseQueryString(queryString), navigationType, key)
    });
  }

  handlePopState(event) {
    if (event.state === undefined)
      return; // Ignore extraneous popstate events in WebKit.

    this._updateLocation(NavigationTypes.POP);
  }

  componentWillMount() {
    super.componentWillMount();
    this._updateLocation();
  }

  componentDidMount() {
    if (window.addEventListener) {
      window.addEventListener('popstate', this.handlePopState, false);
    } else {
      window.attachEvent('onpopstate', this.handlePopState);
    }
  }

  componentWillUnmount() {
    if (window.removeEventListener) {
      window.removeEventListener('popstate', this.handlePopState, false);
    } else {
      window.removeEvent('onpopstate', this.handlePopState);
    }
  }

  push(path, query) {
    var fullPath = this.makePath(path, query);

    if (this.isSupported) {
      this.recordScrollPosition();
      var key = createRandomKey();

      // http://www.w3.org/TR/2011/WD-html5-20110113/history.html#dom-history-pushstate
      this.setState({
        location: this.createLocation(path, query, NavigationTypes.PUSH, key)
      }, function () {
        window.history.pushState({ key }, '', fullPath);
      });
    } else {
      window.location = fullPath;
    }
  }

  replace(path, query) {
    var fullPath = this.makePath(path, query);

    if (this.isSupported) {
      var key = createRandomKey();

      // http://www.w3.org/TR/2011/WD-html5-20110113/history.html#dom-history-replacestate
      this.setState({
        location: this.createLocation(path, query, NavigationTypes.REPLACE, key)
      }, function () {
        window.history.replaceState({ key }, '', fullPath);
      });
    } else {
      window.location.replace(fullPath);
    }
  }

}

export default BrowserHistory;
