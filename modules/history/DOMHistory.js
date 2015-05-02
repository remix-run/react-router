var warning = require('react/lib/warning');
var AbstractHistory = require('./AbstractHistory');

class DOMHistory extends AbstractHistory {

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

}

module.exports = DOMHistory;
