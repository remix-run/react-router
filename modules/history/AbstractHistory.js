var invariant = require('react/lib/invariant');
var Location = require('../Location');

/**
 * A history interface that normalizes the differences across
 * various environments and implementations. Requires concrete
 * subclasses to implement the following methods:
 *
 * - getPath()
 * - push(path)
 * - replace(path)
 * - go(n)
 */
class AbstractHistory {

  constructor(length, current, navigationType) {
    invariant(
      typeof length === 'number' && length > 0,
      'History needs a length greater than 0'
    );

    if (current == null)
      current = length - 1;

    invariant(
      current < length,
      'History current value is out of bounds'
    );

    this.length = length;
    this.current = current;
    this.navigationType = navigationType;
  }

  _notifyChange() {
    if (!this.changeListeners)
      return;

    for (var i = 0, len = this.changeListeners.length; i < len; ++i)
      this.changeListeners[i].call(this);
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

  getLocation() {
    return new Location(this.getPath(), this.navigationType);
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

    var next = this.current + n;
    return next >= 0 && next < this.length;
  }

  canGoBack() {
    return this.canGo(-1);
  }

  canGoForward() {
    return this.canGo(1);
  }

  makeHref(path) {
    return path;
  }

  toJSON() {
    return {
      length: this.length,
      current: this.current,
      navigationType: this.navigationType
    };
  }

}

module.exports = AbstractHistory;
