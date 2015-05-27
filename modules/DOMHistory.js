import React from 'react';
import assign from 'object-assign';
import History from './History';
import Location from './Location';
import { getWindowScrollPosition } from './DOMUtils';

/**
 * A history interface that assumes a DOM environment.
 */
class DOMHistory extends History {

  static propTypes = assign({
    getScrollPosition: React.PropTypes.func.isRequired
  }, History.propTypes);

  static defaultProps = assign({
    getScrollPosition: getWindowScrollPosition
  }, History.defaultProps);

  static childContextTypes = assign({}, History.childContextTypes);

  constructor(props, context) {
    super(props, context);
    this.scrollHistory = {};
  }

  createLocation(path, query, navigationType, key) {
    var fullPath = this.makePath(path, query);
    var scrollPosition = this.scrollHistory[fullPath];

    return new Location(path, query, navigationType, key, scrollPosition);
  }

  go(n) {
    if (n === 0)
      return;

    window.history.go(n);
  }

  recordScrollPosition() {
    var renderedLocation = this.state.location;
    var renderedFullPath = this.makePath(renderedLocation.path, renderedLocation.query);

    this.scrollHistory[renderedFullPath] = this.props.getScrollPosition();
  }

}

export default DOMHistory;
