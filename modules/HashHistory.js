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
class HashHistory extends DOMHistory {

  static propTypes = Object.assign({}, DOMHistory.propTypes);
  static defaultProps = Object.assign({}, DOMHistory.defaultProps);
  static childContextTypes = Object.assign({}, DOMHistory.childContextTypes);

  constructor(props, context) {
    super(props, context);
    this.handleHashChange = this.handleHashChange.bind(this);
    this.navigationType = null;
  }

  _updateLocation(navigationType) {
    var [ path, queryString ] = getHashPath().split('?', 2);

    this.setState({
      location: this.createLocation(path, this.parseQueryString(queryString), navigationType)
    });
  }

  handleHashChange() {
    if (ensureSlash()) {
      var navigationType = this.navigationType;

      // On the next hashchange we want this to be accurate.
      this.navigationType = null;

      this._updateLocation(navigationType);
    }
  }

  componentWillMount() {
    super.componentWillMount();
    this._updateLocation();
  }

  componentDidMount() {
    if (window.addEventListener) {
      window.addEventListener('hashchange', this.handleHashChange, false);
    } else {
      window.attachEvent('onhashchange', this.handleHashChange);
    }
  }

  componentWillUnmount() {
    if (window.removeEventListener) {
      window.removeEventListener('hashchange', this.handleHashChange, false);
    } else {
      window.removeEvent('onhashchange', this.handleHashChange);
    }
  }

  push(path, query) {
    this.recordScrollPosition();
    this.navigationType = NavigationTypes.PUSH;
    window.location.hash = this.makePath(path, query);
  }

  replace(path, query) {
    this.navigationType = NavigationTypes.REPLACE;
    replaceHashPath(this.makePath(path, query));
  }

  makeHref(path, query) {
    return '#' + super.makeHref(path, query);
  }

}

export default HashHistory;
