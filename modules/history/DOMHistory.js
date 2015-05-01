var warning = require('react/lib/warning');
var invariant = require('react/lib/invariant');
var canUseDOM = require('react/lib/ExecutionEnvironment').canUseDOM;
var History = require('./History');

class DOMHistory extends History {

  listen() {
    invariant(
      canUseDOM,
      'You cannot use %s without a DOM',
      this.constructor.displayName
    );
    
    return History.prototype.listen.apply(this, arguments);
  }

  go(n) {
    if (n === 0)
      return;

    warning(
      this.canGo(n),
      'Cannot go(%s); there is not enough history',
      n
    );

    window.history.go(n);
  }

}

module.exports = DOMHistory;
