import History from './History';
import { getWindowScrollPosition } from './DOMUtils';

/**
 * A history interface that assumes a DOM environment.
 */
class DOMHistory extends History {

  constructor(options={}) {
    super(options);
    this.getScrollPosition = options.getScrollPosition || getWindowScrollPosition;
  }

  go(n) {
    if (n === 0)
      return;

    window.history.go(n);
  }

}

export default DOMHistory;
