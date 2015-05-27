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

  getScrollKey(path, query, key) {
    return key || this.makePath(path, query);
  }

  createLocation(path, query, navigationType, key) {
    var scrollKey = this.getScrollKey(path, query, key);
    var scrollPosition = this.scrollHistory[scrollKey];

    return new Location(path, query, navigationType, key, scrollPosition);
  }

  go(n) {
    if (n === 0)
      return;

    window.history.go(n);
  }

  recordScrollPosition() {
    var location = this.state.location;
    var scrollKey = this.getScrollKey(location.path, location.query, location.key);

    this.scrollHistory[scrollKey] = this.props.getScrollPosition();
  }

}

export default DOMHistory;
