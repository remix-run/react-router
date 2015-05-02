var invariant = require('react/lib/invariant');
var NavigationTypes = require('../NavigationTypes');
var AbstractHistory = require('./AbstractHistory');

/**
 * A concrete History class that doesn't require a DOM. Ideal
 * for testing because it allows you to specify route history
 * entries in the constructor.
 */
class History extends AbstractHistory {
  
  constructor(entries, current, navigationType) {
    if (entries == null) {
      entries = [ '/' ];
    } else if (typeof entries === 'string') {
      entries = [ entries ]; // Allow a single path argument.
    }

    invariant(
      Array.isArray(entries) && entries.length > 0,
      'History needs at least one entry'
    );

    super(entries.length, current, navigationType);
    this.entries = entries;
  }

  getPath() {
    return this.entries[this.current];
  }

  push(path) {
    // http://www.w3.org/TR/2011/WD-html5-20110113/history.html#dom-history-pushstate
    this.navigationType = NavigationTypes.PUSH;
    this.current += 1;
    this.entries = this.entries.slice(0, this.current).concat([ path ]);
    this.length = this.entries.length;
    this._notifyChange();
  }

  replace(path) {
    // http://www.w3.org/TR/2011/WD-html5-20110113/history.html#dom-history-replacestate
    this.navigationType = NavigationTypes.REPLACE;
    this.entries[this.current] = path;
    this._notifyChange();
  }

  go(n) {
    if (n === 0)
      return;

    invariant(
      this.canGo(n),
      'Cannot go(%s); there is not enough history',
      n
    );

    this.navigationType = NavigationTypes.POP;
    this.current += n;
    this._notifyChange();
  }

  toJSON() {
    return {
      entries: this.entries,
      current: this.current,
      navigationType: this.navigationType
    };
  }

}

module.exports = History;
