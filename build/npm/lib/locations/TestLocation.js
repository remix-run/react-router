"use strict";

var invariant = require("react/lib/invariant");
var LocationActions = require("../actions/LocationActions");
var History = require("../History");

/**
 * A location that is convenient for testing and does not require a DOM.
 */
function TestLocation(history) {
  this.history = history || [];
  this.listeners = [];
  this._updateHistoryLength();
}

TestLocation.prototype.needsDOM = false;

TestLocation.prototype._updateHistoryLength = function () {
  History.length = this.history.length;
};

TestLocation.prototype._notifyChange = function (type) {
  for (var i = 0, len = this.listeners.length; i < len; ++i) this.listeners[i].call(this, { path: this.getCurrentPath(), type: type });
};

TestLocation.prototype.addChangeListener = function (listener) {
  this.listeners.push(listener);
};

TestLocation.prototype.removeChangeListener = function (listener) {
  this.listeners = this.listeners.filter(function (l) {
    return l !== listener;
  });
};

TestLocation.prototype.push = function (path) {
  this.history.push(path);
  this._updateHistoryLength();
  this._notifyChange(LocationActions.PUSH);
};

TestLocation.prototype.replace = function (path) {
  invariant(this.history.length, "You cannot replace the current path with no history");

  this.history[this.history.length - 1] = path;

  this._notifyChange(LocationActions.REPLACE);
};

TestLocation.prototype.pop = function () {
  this.history.pop();
  this._updateHistoryLength();
  this._notifyChange(LocationActions.POP);
};

TestLocation.prototype.getCurrentPath = function () {
  return this.history[this.history.length - 1];
};

TestLocation.prototype.toString = function () {
  return "<TestLocation>";
};

module.exports = TestLocation;