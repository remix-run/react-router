"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

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

  _createClass(TestLocation, {
    needsDOM: {
      get: function () {
        return false;
      }
    },
    _updateHistoryLength: {
      value: function _updateHistoryLength() {
        History.length = this.history.length;
      }
    },
    _notifyChange: {
      value: function _notifyChange(type) {
        var change = {
          path: this.getCurrentPath(),
          type: type
        };

        for (var i = 0, len = this.listeners.length; i < len; ++i) this.listeners[i].call(this, change);
      }
    },
    addChangeListener: {
      value: function addChangeListener(listener) {
        this.listeners.push(listener);
      }
    },
    removeChangeListener: {
      value: function removeChangeListener(listener) {
        this.listeners = this.listeners.filter(function (l) {
          return l !== listener;
        });
      }
    },
    push: {
      value: function push(path) {
        this.history.push(path);
        this._updateHistoryLength();
        this._notifyChange(LocationActions.PUSH);
      }
    },
    replace: {
      value: function replace(path) {
        invariant(this.history.length, "You cannot replace the current path with no history");

        this.history[this.history.length - 1] = path;

        this._notifyChange(LocationActions.REPLACE);
      }
    },
    pop: {
      value: function pop() {
        this.history.pop();
        this._updateHistoryLength();
        this._notifyChange(LocationActions.POP);
      }
    },
    getCurrentPath: {
      value: function getCurrentPath() {
        return this.history[this.history.length - 1];
      }
    },
    toString: {
      value: function toString() {
        return "<TestLocation>";
      }
    }
  });

  return TestLocation;
})();

module.exports = TestLocation;