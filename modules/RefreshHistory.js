import DOMHistory from './DOMHistory';

/**
 * A history implementation that provides clean URLs in DOM
 * environments that lack support for HTML5 history by simply
 * sending a new request to the server on push/replace.
 */
class RefreshHistory extends DOMHistory {

  static propTypes = Object.assign({}, DOMHistory.propTypes);
  static defaultProps = Object.assign({}, DOMHistory.defaultProps);
  static childContextTypes = Object.assign({}, DOMHistory.childContextTypes);

  push(path, query) {
    window.location = this.makePath(path, query);
  }

  replace(path, query) {
    window.location.replace(this.makePath(path, query));
  }

}

export default RefreshHistory;
