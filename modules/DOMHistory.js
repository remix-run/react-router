import History from './History';
import { getWindowScrollPosition } from './DOMUtils';
import Location from './Location';

/**
 * A history interface that assumes a DOM environment.
 */
class DOMHistory extends History {

  constructor(getScrollPosition=getWindowScrollPosition) {
    super();
    this.getScrollPosition = getScrollPosition;
    this.scrollHistory = {};
  }

  go(n) {
    if (n === 0)
      return;

    window.history.go(n);
  }

  _createLocation(path, key, navigationType) {
    var scrollKey = key || path;
    var scrollPosition = this.scrollHistory[scrollKey];

    return new Location(path, key, navigationType, scrollPosition);
  }

  _recordScrollPosition() {
    var location = this.location;
    var scrollKey = location.key || location.path;

    this.scrollHistory[scrollKey] = this.getScrollPosition();
  }

}

export default DOMHistory;
