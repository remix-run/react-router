var warning = require('warning');
var AbstractHistory = require('./AbstractHistory');
var Location = require('./Location');
var { getWindowScrollPosition } = require('./DOMUtils');

class DOMHistory extends AbstractHistory {

  constructor() {
    super(...arguments);
    this.scrollHistory = {};
  }

  go(n) {
    if (n === 0)
      return;

    warning(
      this.canGo(n),
      'Cannot go(%s); there is not enough history',
      n
    );

    this.navigationType = NavigationTypes.POP;
    this.current += n;

    window.history.go(n);
  }

  getLocation() {
    var path = this.getPath();
    var scrollPosition = this.scrollHistory[path];

    return new Location(path, this.navigationType, scrollPosition);
  }

  /**
   * You may override this method to check a custom overflowing <div>:
   * https://github.com/rackt/react-router/issues/1112
   */
  getScrollPosition() {
    return getWindowScrollPosition();
  }

  recordScrollPosition() {
    var pathBeforePush = this.getPath();
    this.scrollHistory[pathBeforePush] = this.getScrollPosition();
  }

}

module.exports = DOMHistory;
