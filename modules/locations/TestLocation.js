var LocationActions = require('../actions/LocationActions');

var _listener;

function notifyChange(type) {
  if (_listener)
    _listener({ path: TestLocation.getCurrentPath(), type: type });
}

/**
 * A location that is convenient for testing and does not
 * require a DOM. You should manually setup TestLocation.history
 * with the URL paths your test needs before it runs.
 */
var TestLocation = {

  history: [],

  addChangeListener: function (listener) {
    // TestLocation only ever supports a single listener at a time.
    _listener = listener;
  },

  push: function (path) {
    TestLocation.history.push(path);
    notifyChange(LocationActions.PUSH);
  },

  replace: function (path) {
    TestLocation.history[TestLocation.history.length - 1] = path;
    notifyChange(LocationActions.REPLACE);
  },

  pop: function () {
    TestLocation.history.pop();
    notifyChange(LocationActions.POP);
  },

  getCurrentPath: function () {
    return TestLocation.history[TestLocation.history.length - 1];
  },

  toString: function () {
    return '<TestLocation>';
  }

};

module.exports = TestLocation;
