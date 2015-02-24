"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var invariant = require("react/lib/invariant");
var LocationActions = require("../actions/LocationActions");
var History = require("../History");

/**
 * A location that is convenient for testing and does not require a DOM.
 */

var TestLocation = (function () {
  function TestLocation(history) {
    _classCallCheck(this, TestLocation);

    this.history = history || [];
    this.listeners = [];
    this._updateHistoryLength();
  }

  _prototypeProperties(TestLocation, null, {
    needsDOM: {
      get: function () {
        return false;
      },
      configurable: true
    },
    _updateHistoryLength: {
      value: function _updateHistoryLength() {
        History.length = this.history.length;
      },
      writable: true,
      configurable: true
    },
    _notifyChange: {
      value: function _notifyChange(type) {
        for (var i = 0, len = this.listeners.length; i < len; ++i) this.listeners[i].call(this, { path: this.getCurrentPath(), type: type });
      },
      writable: true,
      configurable: true
    },
    addChangeListener: {
      value: function addChangeListener(listener) {
        this.listeners.push(listener);
      },
      writable: true,
      configurable: true
    },
    removeChangeListener: {
      value: function removeChangeListener(listener) {
        this.listeners = this.listeners.filter(function (l) {
          return l !== listener;
        });
      },
      writable: true,
      configurable: true
    },
    push: {
      value: function push(path) {
        this.history.push(path);
        this._updateHistoryLength();
        this._notifyChange(LocationActions.PUSH);
      },
      writable: true,
      configurable: true
    },
    replace: {
      value: function replace(path) {
        invariant(this.history.length, "You cannot replace the current path with no history");

        this.history[this.history.length - 1] = path;

        this._notifyChange(LocationActions.REPLACE);
      },
      writable: true,
      configurable: true
    },
    pop: {
      value: function pop() {
        this.history.pop();
        this._updateHistoryLength();
        this._notifyChange(LocationActions.POP);
      },
      writable: true,
      configurable: true
    },
    getCurrentPath: {
      value: function getCurrentPath() {
        return this.history[this.history.length - 1];
      },
      writable: true,
      configurable: true
    },
    toString: {
      value: function toString() {
        return "<TestLocation>";
      },
      writable: true,
      configurable: true
    }
  });

  return TestLocation;
})();

module.exports = TestLocation;