var invariant = require('react/lib/invariant');
var LocationActions = require('../actions/LocationActions');
var History = require('../History');

/**
 * A location that is convenient for testing and does not require a DOM.
 */
class TestLocation {

  constructor(history) {
    this.history = history || [];
    this.listeners = [];
    this._updateHistoryLength();
  }

  get needsDOM() {
    return false;
  }

  _updateHistoryLength() {
    History.length = this.history.length;
  }

  _notifyChange(type) {
    var change = {
      path: this.getCurrentPath(),
      type: type
    };

    for (var i = 0, len = this.listeners.length; i < len; ++i)
      this.listeners[i].call(this, change);
  }

  addChangeListener(listener) {
    this.listeners.push(listener);
  }

  removeChangeListener(listener) {
    this.listeners = this.listeners.filter(function (l) {
      return l !== listener;
    });
  }

  push(path) {
    if (!this.history.length || path !== this.getCurrentPath()) {
      this.history.push(path);
      this._updateHistoryLength();
      this._notifyChange(LocationActions.PUSH);
    } else {
      this._notifyChange(LocationActions.REFRESH);
    }
  }

  replace(path) {
    invariant(
      this.history.length,
      'You cannot replace the current path with no history'
    );

    if (path !== this.getCurrentPath()) {
      this.history[this.history.length - 1] = path;
      this._notifyChange(LocationActions.REPLACE);
    } else {
      this._notifyChange(LocationActions.REFRESH);
    }

  }

  pop() {
    this.history.pop();
    this._updateHistoryLength();
    this._notifyChange(LocationActions.POP);
  }

  getCurrentPath() {
    return this.history[this.history.length - 1];
  }

  toString() {
    return '<TestLocation>';
  }

}

module.exports = TestLocation;
