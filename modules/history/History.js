var invariant = require('react/lib/invariant');
var NavigationTypes = require('../NavigationTypes');
var Location = require('../Location');

/**
 * A history interface that normalizes the differences across
 * various environments and implementations.
 */
class History {

  constructor(entries, current) {
    if (!(this instanceof History))
      return new History(entries, current);

    if (entries == null) {
      entries = [ '/' ];
    } else if (typeof entries === 'string') {
      entries = [ entries ];
    }

    invariant(
      Array.isArray(entries) && entries.length > 0,
      'History needs at least one entry'
    );

    if (current == null)
      current = entries.length - 1;

    invariant(
      current < entries.length,
      'History current value is out of bounds'
    );

    this._entries = entries;
    this._current = current;
  }

  listen(listener) {
    this.addChangeListener(listener);
    listener.call(this, new Location(this.getCurrentPath()));
  }

  addChangeListener(listener) {
    if (!this.changeListeners)
      this.changeListeners = [];

    this.changeListeners.push(listener);
  }

  removeChangeListener(listener) {
    if (!this.changeListeners)
      return;

    this.changeListeners = this.changeListeners.filter(function (li) {
      return li !== listener;
    });
  }

  notifyChange(navigationType) {
    if (!this.changeListeners)
      return;

    var location = new Location(this.getCurrentPath(), navigationType);

    for (var i = 0, len = this.changeListeners.length; i < len; ++i)
      this.changeListeners[i].call(this, location);
  }

  getLength() {
    return this._entries.length;
  }

  getCurrent() {
    return this._current;
  }

  getCurrentPath() {
    return this._entries[this.getCurrent()];
  }

  push(path) {
    // http://www.w3.org/TR/2011/WD-html5-20110113/history.html#dom-history-pushstate
    this._current += 1;
    this._entries = this._entries.slice(0, this._current).concat([ path ]);
    this.notifyChange(NavigationTypes.PUSH);
  }

  replace(path) {
    // http://www.w3.org/TR/2011/WD-html5-20110113/history.html#dom-history-replacestate
    this._entries[this._current] = path;
    this.notifyChange(NavigationTypes.REPLACE);
  }

  go(n) {
    if (n === 0)
      return;

    invariant(
      this.canGo(n),
      'Cannot go(%s); there is not enough history',
      n
    );

    this._current += n;

    this.notifyChange(NavigationTypes.POP);
  }

  back() {
    this.go(-1);
  }

  forward() {
    this.go(1);
  }

  canGo(n) {
    if (n === 0)
      return true;

    var next = this.getCurrent() + n;
    return next >= 0 && next < this.getLength();
  }

  canGoBack() {
    return this.canGo(-1);
  }

  canGoForward() {
    return this.canGo(1);
  }

}

module.exports = History;
