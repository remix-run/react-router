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

  saveState(key, state) {
    window.sessionStorage.setItem(key, JSON.stringify(state));
  }

  readState(key) {
    var json = window.sessionStorage.getItem(key);

    if (json) {
      try {
        return JSON.parse(json);
      } catch (error) {
        // Ignore invalid JSON in session storage.
      }
    }

    return null;
  }

  pushState(state, path) {
    var location = this.location;
    if (location && location.state && location.state.key) {
      var key = location.state.key;
      var curState = this.readState(key);
      var scroll = this.getScrollPosition();
      this.saveState(key, {...curState, ...scroll});
    }

    super.pushState(state, path);
  }

}

export default DOMHistory;
