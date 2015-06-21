import History from './History';
import { getWindowScrollPosition } from './DOMUtils';
import NavigationTypes from './NavigationTypes';

/**
 * A history interface that assumes a DOM environment.
 */
class DOMHistory extends History {
  constructor(options={}) {
    super(options);
    this.getScrollPosition = options.getScrollPosition || getWindowScrollPosition;
    this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
  }

  setup(path, entry) {
    super.setup(path, entry);

    if (window.addEventListener) {
      window.addEventListener('beforeunload', this.handleBeforeUnload);
    } else {
      window.attachEvent('onbeforeunload', this.handleBeforeUnload);
    }
  }

  teardown() {
    if (window.removeEventListener) {
      window.removeEventListener('beforeunload', this.handleBeforeUnload);
    } else {
      window.detachEvent('onbeforeunload', this.handleBeforeUnload);
    }

    super.teardown();
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

  beforeChange(location, done) {
    super.beforeChange(location, () => {
      if (location.navigationType === NavigationTypes.PUSH && this.canUpdateState()) {
        var scrollPosition = this.getScrollPosition();
        this.updateState(scrollPosition);
      }
      done();
    });
  }

  handleBeforeUnload(event) {
    var message = this.beforeChangeListener.call(this);

    if (message != null) {
      // cross browser, see https://developer.mozilla.org/en-US/docs/Web/Events/beforeunload
      (event || window.event).returnValue = message;
      return message;
    }
  }

}

export default DOMHistory;
